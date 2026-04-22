import { useState, useEffect, useMemo } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export interface UserInfo {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    customerId?: string;
}

export interface KYCRecord {
    _id: string;
    kycReference: string;
    userId: UserInfo;
    documentType: string;
    currentStatus: string;
    attachments: {
        fileUrl: string;
        fileName: string;
        fileType: string;
        uploadedAt: string;
    }[];
    createdAt: string;
    documentDetails?: { issuedCountry?: string; expiryDate?: string };
    verifiedAt?: string;
    metadata?: { rejectionReason?: string; ipAddress?: string };
    isReuploaded?: boolean;
    accountRequestId?: string;
}

export interface KYCReviewGroup {
    userId: string;
    name: string;
    email: string;
    customerId?: string;
    latestActivityAt: string;
    highestPriorityStatus: string;
    hasReuploaded: boolean;
    documents: Array<{
        id: string;
        type: string;
        status: string;
        reference: string;
    }>;
    stats: {
        total: number;
        pending: number;
        verified: number;
        rejected: number;
    };
}

const STATUS_PRIORITY: Record<string, number> = {
    Pending: 1,
    "In-Review": 2,
    Rejected: 3,
    Verified: 4,
    Expired: 5,
};

export const useAdminKYC = () => {
    const { apiFetch } = useAuthContext();
    const router = useRouter();

    const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [docTypeFilter, setDocTypeFilter] = useState("All");
    const [reuploadFilter, setReuploadFilter] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchKYCRecords = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/admin/kyc");
            if (res.ok) setKycRecords(await res.json());
        } catch (error) {
            console.error("Failed to fetch KYC records", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKYCRecords();
    }, [apiFetch]);

    const groupedRecords = useMemo<KYCReviewGroup[]>(() => {
        const grouped = new Map<string, KYCReviewGroup>();

        for (const kyc of kycRecords) {
            const groupKey = kyc.accountRequestId || kyc.userId?._id || kyc._id;
            const existingGroup = grouped.get(groupKey);
            const fullName =
                `${kyc.userId?.firstName || ""} ${kyc.userId?.lastName || ""}`.trim() ||
                "Unknown Customer";

            const currentTimestamp = new Date(kyc.createdAt).getTime();
            const existingTimestamp = existingGroup
                ? new Date(existingGroup.latestActivityAt).getTime()
                : 0;
            const currentPriority = STATUS_PRIORITY[kyc.currentStatus] ?? 99;
            const existingPriority = existingGroup
                ? (STATUS_PRIORITY[existingGroup.highestPriorityStatus] ?? 99)
                : 99;

            if (!existingGroup) {
                grouped.set(groupKey, {
                    userId: groupKey,
                    name: fullName,
                    email: kyc.userId?.email || "No email",
                    customerId: kyc.userId?.customerId,
                    latestActivityAt: kyc.createdAt,
                    highestPriorityStatus: kyc.currentStatus,
                    hasReuploaded: Boolean(kyc.isReuploaded),
                    documents: [
                        {
                            id: kyc._id,
                            type: kyc.documentType,
                            status: kyc.currentStatus,
                            reference: kyc.kycReference,
                        },
                    ],
                    stats: {
                        total: 1,
                        pending: ["Pending", "In-Review"].includes(
                            kyc.currentStatus,
                        )
                            ? 1
                            : 0,
                        verified: kyc.currentStatus === "Verified" ? 1 : 0,
                        rejected: kyc.currentStatus === "Rejected" ? 1 : 0,
                    },
                });
                continue;
            }

            existingGroup.documents.push({
                id: kyc._id,
                type: kyc.documentType,
                status: kyc.currentStatus,
                reference: kyc.kycReference,
            });
            existingGroup.stats.total += 1;
            existingGroup.stats.pending += ["Pending", "In-Review"].includes(
                kyc.currentStatus,
            )
                ? 1
                : 0;
            existingGroup.stats.verified +=
                kyc.currentStatus === "Verified" ? 1 : 0;
            existingGroup.stats.rejected +=
                kyc.currentStatus === "Rejected" ? 1 : 0;
            existingGroup.hasReuploaded =
                existingGroup.hasReuploaded || Boolean(kyc.isReuploaded);

            if (
                currentPriority < existingPriority ||
                (currentPriority === existingPriority &&
                    currentTimestamp > existingTimestamp)
            ) {
                existingGroup.highestPriorityStatus = kyc.currentStatus;
            }
            if (currentTimestamp > existingTimestamp) {
                existingGroup.latestActivityAt = kyc.createdAt;
            }
        }

        return Array.from(grouped.values())
            .map((group) => ({
                ...group,
                documents: group.documents.sort((a, b) => {
                    const diff =
                        (STATUS_PRIORITY[a.status] ?? 99) -
                        (STATUS_PRIORITY[b.status] ?? 99);
                    return diff !== 0 ? diff : a.type.localeCompare(b.type);
                }),
            }))
            .sort((a, b) => {
                const diff =
                    (STATUS_PRIORITY[a.highestPriorityStatus] ?? 99) -
                    (STATUS_PRIORITY[b.highestPriorityStatus] ?? 99);
                return diff !== 0
                    ? diff
                    : new Date(b.latestActivityAt).getTime() -
                          new Date(a.latestActivityAt).getTime();
            });
    }, [kycRecords]);

    const filteredRecords = groupedRecords.filter((group) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            !query ||
            group.name.toLowerCase().includes(query) ||
            group.email.toLowerCase().includes(query) ||
            group.customerId?.toLowerCase().includes(query) ||
            group.documents.some(
                (d) =>
                    d.reference.toLowerCase().includes(query) ||
                    d.type.toLowerCase().includes(query),
            );
        const matchesStatus =
            statusFilter === "All" ||
            group.documents.some((d) => d.status === statusFilter);
        const matchesDocType =
            docTypeFilter === "All" ||
            group.documents.some((d) => d.type === docTypeFilter);
        const matchesReupload = !reuploadFilter || group.hasReuploaded;
        return (
            matchesSearch && matchesStatus && matchesDocType && matchesReupload
        );
    });

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    return {
        isLoading,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        docTypeFilter,
        setDocTypeFilter,
        reuploadFilter,
        setReuploadFilter,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedRecords,
        router,
    };
};
