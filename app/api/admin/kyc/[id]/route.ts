import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import AccountRequest from "@/models/AccountRequests";
import KYC from "@/models/KYC";
import Notification from "@/models/Notifications";
import { verifyAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import {
    pickLatestDocumentsByType,
    resolveKycReviewBundle,
} from "@/lib/kycWorkflow";

export const dynamic = "force-dynamic";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        await dbConnect();

        const decoded = verifyAuth(await headers());
        if (
            !decoded ||
            !["Admin", "Manager", "Employee"].includes(decoded.role)
        ) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );
        }

        const { id } = await context.params;
        const bundle = await resolveKycReviewBundle(id);

        if (!bundle) {
            return NextResponse.json(
                { message: "KYC record not found" },
                { status: 404 },
            );
        }

        return NextResponse.json(bundle, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching KYC:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        await dbConnect();

        const decoded = verifyAuth(await headers());
        if (
            !decoded ||
            !["Admin", "Manager", "Employee"].includes(decoded.role)
        ) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await req.json();
        const { status, rejectionReason } = body;

        const validStatuses = [
            "Pending",
            "In-Review",
            "Verified",
            "Rejected",
            "Expired",
        ];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { message: "Invalid status provided." },
                { status: 400 },
            );
        }

        if (status === "Rejected" && !rejectionReason?.trim()) {
            return NextResponse.json(
                { message: "A rejection reason is required." },
                { status: 400 },
            );
        }

        const { id } = await context.params;
        const kycRecord = await KYC.findById(id);

        if (!kycRecord) {
            return NextResponse.json(
                { message: "KYC record not found" },
                { status: 404 },
            );
        }

        if (kycRecord.documentType === "Signature") {
            if (kycRecord.currentStatus !== "Verified") {
                kycRecord.currentStatus = "Verified";
                await kycRecord.save();
            }

            return NextResponse.json(
                {
                    message: "Signature documents are auto-approved.",
                    record: kycRecord,
                },
                { status: 200 },
            );
        }

        const prevState = kycRecord.currentStatus;

        if (!kycRecord.statusHistory) {
            kycRecord.statusHistory = [];
        }

        if (!kycRecord.documentDetails) {
            kycRecord.documentDetails = { issuedCountry: "India" } as any;
        } else if (!kycRecord.documentDetails.issuedCountry) {
            kycRecord.documentDetails.issuedCountry = "India";
        }

        kycRecord.currentStatus = status;

        if (!kycRecord.metadata) {
            kycRecord.metadata = {};
        }

        if (status === "Rejected") {
            kycRecord.metadata.rejectionReason = rejectionReason.trim();
        } else if (status === "Verified") {
            kycRecord.metadata.rejectionReason = undefined;
        }

        await kycRecord.save();

        const relatedAccountRequest = await AccountRequest.findOne({
            userId: kycRecord.userId,
            currentStatus: { $ne: "Approved" },
        }).sort({ createdAt: -1 });

        if (relatedAccountRequest) {
            if (!Array.isArray((relatedAccountRequest as any).statusHistory)) {
                (relatedAccountRequest as any).statusHistory = [];
            }

            if (!relatedAccountRequest.metadata) {
                relatedAccountRequest.metadata = {};
            }

            const matchingDocs = await KYC.find({
                userId: kycRecord.userId,
                documentType: { $in: ["PAN", "Aadhar"] },
            }).sort({ updatedAt: -1, createdAt: -1 });

            const latestDocs = pickLatestDocumentsByType(matchingDocs).filter(
                (doc) =>
                    doc.documentType === "PAN" || doc.documentType === "Aadhar",
            );

            const hasRejectedDoc = latestDocs.some(
                (doc) => doc.currentStatus === "Rejected",
            );
            const allCoreDocsVerified =
                latestDocs.length === 2 &&
                latestDocs.every((doc) => doc.currentStatus === "Verified");

            if (hasRejectedDoc) {
                relatedAccountRequest.currentStatus = "Rejected";
                relatedAccountRequest.metadata = {
                    ...(relatedAccountRequest.metadata || {}),
                    rejectionReason:
                        rejectionReason?.trim() ||
                        `${kycRecord.documentType} verification failed.`,
                    reviewedBy: decoded.userId,
                };
            } else if (
                !allCoreDocsVerified &&
                relatedAccountRequest.currentStatus !== "Approved"
            ) {
                relatedAccountRequest.currentStatus = "Pending_KYC";
                relatedAccountRequest.metadata = {
                    ...(relatedAccountRequest.metadata || {}),
                    rejectionReason: undefined,
                    reviewedBy: decoded.userId,
                };
            } else {
                relatedAccountRequest.metadata = {
                    ...(relatedAccountRequest.metadata || {}),
                    rejectionReason: undefined,
                    reviewedBy: decoded.userId,
                };
            }

            await relatedAccountRequest.save();
        }

        if (status === "Rejected") {
            await Notification.create({
                userId: kycRecord.userId,
                title: `${kycRecord.documentType} Document Rejected`,
                body: `${rejectionReason.trim()} Please re-upload your ${kycRecord.documentType} document for another review.`,
                type: "Alert",
                actionUrl: "/my/accounts",
                relatedEntityId: kycRecord._id,
            });
        }

        await createAuditLog({
            userId: decoded.userId,
            userRole: decoded.role,
            actionType:
                status === "Verified"
                    ? "KYC_VERIFIED"
                    : status === "Rejected"
                      ? "KYC_REJECTED"
                      : "KYC_SUBMITTED",
            category: "Security",
            severity: status === "Verified" ? "Medium" : "High",
            resource: "KYC",
            resourceId: kycRecord._id,
            description: `KYC status changed from ${prevState} to ${status}`,
            currentStatus: "Success",
            payload: {
                previousState: JSON.stringify({ status: prevState }),
                newState: JSON.stringify({ status, rejectionReason }),
            },
        });

        return NextResponse.json(
            {
                message: `KYC successfully updated to ${status}`,
                record: kycRecord,
            },
            { status: 200 },
        );
    } catch (error: any) {
        console.error("Error updating KYC:", error);
        return NextResponse.json(
            { message: error?.message || "Internal server error" },
            { status: 500 },
        );
    }
}
