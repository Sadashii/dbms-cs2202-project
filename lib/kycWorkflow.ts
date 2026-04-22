import AccountRequest from "@/models/AccountRequests";
import KYC from "@/models/KYC";
import User from "@/models/User";
import { ensureUserHasValidCustomerId } from "@/lib/customerId";

const REQUIRED_DOCUMENT_TYPES = ["PAN", "Aadhar", "Signature"] as const;

export async function autoApproveSignatureDocuments(userId?: string) {
    if (!userId) return;

    const signatureDocs = await KYC.find({
        userId,
        documentType: "Signature",
        currentStatus: { $ne: "Verified" },
    });

    for (const doc of signatureDocs) {
        doc.currentStatus = "Verified";
        doc.metadata = {
            ...(doc.metadata || {}),
            rejectionReason: undefined,
        };
        await doc.save();
    }
}

export function pickLatestDocumentsByType(documents: any[]) {
    const latestByType = new Map<string, any>();

    for (const document of documents) {
        const existing = latestByType.get(document.documentType);
        if (!existing) {
            latestByType.set(document.documentType, document);
            continue;
        }

        const existingUpdatedAt = new Date(
            existing.updatedAt || existing.createdAt,
        ).getTime();
        const nextUpdatedAt = new Date(
            document.updatedAt || document.createdAt,
        ).getTime();
        if (nextUpdatedAt > existingUpdatedAt) {
            latestByType.set(document.documentType, document);
        }
    }

    return REQUIRED_DOCUMENT_TYPES.map((type) => latestByType.get(type)).filter(
        Boolean,
    );
}

export async function resolveKycReviewBundle(identifier: string) {
    let user: any = null;
    let accountRequest = await AccountRequest.findById(identifier).lean();

    if (accountRequest) {
        user = await User.findById(accountRequest.userId)
            .select("firstName lastName email customerId")
            .lean();
    } else {
        user = await User.findById(identifier)
            .select("firstName lastName email customerId")
            .lean();
        if (!user) {
            const seedDocument = await KYC.findById(identifier)
                .populate({
                    path: "userId",
                    select: "firstName lastName email customerId",
                })
                .lean();
            if (seedDocument && seedDocument.userId) {
                user = seedDocument.userId;
            }
        }
    }

    if (!user) return null;

    const userId = String(user._id);
    const hydratedUser = await ensureUserHasValidCustomerId(userId);
    if (hydratedUser) {
        user = {
            _id: hydratedUser._id,
            firstName: hydratedUser.firstName,
            lastName: hydratedUser.lastName,
            email: hydratedUser.email,
            customerId: hydratedUser.customerId,
        } as any;
    }

    await autoApproveSignatureDocuments(userId);

    if (!accountRequest) {
        accountRequest =
            (await AccountRequest.findOne({
                userId,
                currentStatus: { $ne: "Approved" },
            })
                .sort({ createdAt: -1 })
                .lean()) ||
            (await AccountRequest.findOne({ userId })
                .sort({ createdAt: -1 })
                .lean());
    }

    let documents: any[] = [];

    if (accountRequest) {
        documents = await KYC.find({ accountRequestId: accountRequest._id })
            .sort({ updatedAt: -1, createdAt: -1 })
            .lean();
    }

    if (documents.length === 0 && accountRequest) {
        const requestFileUrls = [
            accountRequest.kycDocuments?.panCardFileUrl,
            accountRequest.kycDocuments?.aadharFileUrl,
            accountRequest.kycDocuments?.signatureFileUrl,
        ].filter(Boolean);

        if (requestFileUrls.length) {
            documents = await KYC.find({
                userId,
                documentType: { $in: REQUIRED_DOCUMENT_TYPES },
                "attachments.fileUrl": { $in: requestFileUrls },
            })
                .sort({ updatedAt: -1, createdAt: -1 })
                .lean();
        }
    }

    if (documents.length === 0) {
        documents = await KYC.find({
            userId,
            documentType: { $in: REQUIRED_DOCUMENT_TYPES },
        })
            .sort({ updatedAt: -1, createdAt: -1 })
            .lean();
    }

    return {
        user,
        accountRequest,
        documents,
        requiredDocumentTypes: [...REQUIRED_DOCUMENT_TYPES],
    };
}
