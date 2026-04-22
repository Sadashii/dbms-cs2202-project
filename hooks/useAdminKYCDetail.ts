import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import toast from "react-hot-toast";

export interface UserInfo {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    customerId?: string;
}

export interface Attachment {
    fileUrl: string;
    fileName: string;
    fileType: string;
    uploadedAt: string;
}

export interface StatusHistoryEvent {
    state: string;
    remarks?: string;
    updatedAt: string;
}

export interface KYCRecord {
    _id: string;
    kycReference: string;
    documentType: string;
    currentStatus: string;
    attachments: Attachment[];
    statusHistory: StatusHistoryEvent[];
    createdAt: string;
    updatedAt: string;
    documentDetails?: {
        encryptedNumber?: string;
        issuedCountry?: string;
    };
    metadata?: {
        rejectionReason?: string;
    };
}

export interface BundleResponse {
    user: UserInfo;
    accountRequest?: {
        _id: string;
        accountType: string;
        currentStatus: string;
        createdAt: string;
    } | null;
    documents: KYCRecord[];
    requiredDocumentTypes: string[];
}

export const useAdminKYCDetail = () => {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { apiFetch } = useAuthContext();

    const [bundle, setBundle] = useState<BundleResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

    const fetchBundle = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch(`/api/admin/kyc/${id}`);
            if (!res.ok) {
                router.push("/admin/kyc");
                return;
            }

            const data = await res.json();
            setBundle(data);
            if (!selectedDocumentId) {
                setSelectedDocumentId(data.documents?.[0]?._id || null);
            }
        } catch (error) {
            console.error("Failed to fetch KYC bundle", error);
            router.push("/admin/kyc");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchBundle();
        }
    }, [id, apiFetch]);

    const handleUpdateStatus = async (
        documentId: string,
        status: string,
        reason?: string,
    ) => {
        setProcessingId(documentId);
        try {
            const res = await apiFetch(`/api/admin/kyc/${documentId}`, {
                method: "PATCH",
                body: JSON.stringify({ status, rejectionReason: reason }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to update KYC status.");
                return;
            }

            toast.success(data.message || `Document marked as ${status}.`);
            setRejectingId(null);
            setRejectionReason("");
            await fetchBundle();
        } catch (error) {
            toast.error("An error occurred during status sync.");
        } finally {
            setProcessingId(null);
        }
    };

    const statusSummary = useMemo(() => {
        const documents = bundle?.documents || [];
        return {
            verified: documents.filter((doc) => doc.currentStatus === "Verified").length,
            rejected: documents.filter((doc) => doc.currentStatus === "Rejected").length,
            pending: documents.filter((doc) => ["Pending", "In-Review"].includes(doc.currentStatus)).length,
        };
    }, [bundle]);

    const groupedDocuments = useMemo(() => {
        if (!bundle?.documents) return [];

        const groups = new Map<string, KYCRecord[]>();
        for (const doc of bundle.documents) {
            if (!groups.has(doc.documentType)) {
                groups.set(doc.documentType, []);
            }
            groups.get(doc.documentType)!.push(doc);
        }

        return Array.from(groups.values()).map((docs) => {
            return docs.sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
        });
    }, [bundle]);

    const selectedDocument = useMemo(() => {
        if (!bundle?.documents?.length) return null;

        return (
            bundle.documents.find((document) => document._id === selectedDocumentId) ||
            groupedDocuments[0]?.[0] ||
            bundle.documents[0]
        );
    }, [bundle, selectedDocumentId, groupedDocuments]);

    const selectedDocumentGroup = useMemo(() => {
        if (!selectedDocument || !groupedDocuments.length) return [];
        return groupedDocuments.find((g) => g[0].documentType === selectedDocument.documentType) || [];
    }, [selectedDocument, groupedDocuments]);

    return {
        bundle,
        isLoading,
        processingId,
        rejectingId, setRejectingId,
        rejectionReason, setRejectionReason,
        selectedDocumentId, setSelectedDocumentId,
        handleUpdateStatus,
        statusSummary,
        groupedDocuments,
        selectedDocument,
        selectedDocumentGroup,
        router
    };
};
