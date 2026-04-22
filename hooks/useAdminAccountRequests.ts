import { useState, useEffect } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import toast from "react-hot-toast";

export interface KYC {
    _id: string;
    kycReference: string;
    documentType: string;
    currentStatus: string;
    attachments: { fileUrl: string; fileType: string }[];
    documentDetails?: {
        issuedCountry?: string;
        expiryDate?: string;
    };
}

export interface UserInfo {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
}

export interface AccountRequest {
    _id: string;
    userId: UserInfo;
    accountType: string;
    currentStatus: string;
    createdAt: string;
    metadata?: {
        ipAddress?: string;
        rejectionReason?: string;
    };
    kycs: KYC[];
}

export const useAdminAccountRequests = () => {
    const { apiFetch } = useAuthContext();
    const [requests, setRequests] = useState<AccountRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(
        null,
    );
    const [rejectionReason, setRejectionReason] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/admin/account-requests");
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch account requests", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [apiFetch]);

    const handleApprove = async (requestId: string) => {
        setProcessingId(requestId);
        try {
            const res = await apiFetch(
                `/api/admin/account-requests/${requestId}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ action: "approve" }),
                },
            );

            if (res.ok) {
                toast.success("Account Approved successfully!");
                fetchRequests();
            } else {
                const error = await res.json();
                toast.error(error.message || "Failed to approve request.");
            }
        } catch (error) {
            toast.error("An error occurred during verification.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectingRequestId) return;
        setProcessingId(rejectingRequestId);
        try {
            const res = await apiFetch(
                `/api/admin/account-requests/${rejectingRequestId}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        action: "reject",
                        reason: rejectionReason,
                    }),
                },
            );

            if (res.ok) {
                toast.success("Account Request Rejected.");
                setIsRejectModalOpen(false);
                setRejectionReason("");
                fetchRequests();
            } else {
                const error = await res.json();
                toast.error(error.message || "Failed to reject.");
            }
        } catch (error) {
            toast.error("Network error.");
        } finally {
            setProcessingId(null);
            setRejectingRequestId(null);
        }
    };

    const openRejectModal = (id: string) => {
        setRejectingRequestId(id);
        setIsRejectModalOpen(true);
    };

    const filteredRequests = requests.filter((req) => {
        const name =
            `${req.userId?.firstName || ""} ${req.userId?.lastName || ""}`.toLowerCase();
        const email = (req.userId?.email || "").toLowerCase();
        const matchesSearch =
            email.includes(searchQuery.toLowerCase()) ||
            (req.accountType || "")
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            name.includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === "All" || req.currentStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const paginatedRequests = filteredRequests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    return {
        requests,
        isLoading,
        processingId,
        isRejectModalOpen,
        setIsRejectModalOpen,
        rejectionReason,
        setRejectionReason,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedRequests,
        handleApprove,
        handleReject,
        openRejectModal,
        fetchRequests,
    };
};
