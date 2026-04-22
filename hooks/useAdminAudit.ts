import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export interface AuditLog {
    _id: string;
    logReference: string;
    userId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    } | null;
    userRole: string;
    actionType: string;
    category: string;
    severity: "Low" | "Medium" | "High" | "Critical";
    resource: string;
    resourceId?: string;
    description: string;
    payload: {
        previousState?: string;
        newState?: string;
        diff?: string[];
    };
    metadata: {
        ipAddress: string;
        userAgent: string;
        deviceId?: string;
        geoPoint?: string;
        sessionId?: string;
    };
    currentStatus: "Success" | "Failure" | "Blocked" | "Flagged";
    createdAt: string;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export const useAdminAudit = () => {
    const { user, apiFetch, isLoading: authLoading, isLoggedIn } = useAuthContext();
    const router = useRouter();

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const [search, setSearch] = useState("");
    const [severity, setSeverity] = useState("All");
    const [category, setCategory] = useState("All");
    const [status, setStatus] = useState("All");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) router.push("/auth/login");
        if (!authLoading && user && !["Admin", "Manager"].includes(user.role)) {
            router.push("/my");
            toast.error("Unauthorized access to audit logs.");
        }
    }, [authLoading, isLoggedIn, user, router]);

    const fetchLogs = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                ...(search && { search }),
                ...(severity !== "All" && { severity }),
                ...(category !== "All" && { category }),
                ...(status !== "All" && { status }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
            });

            const res = await apiFetch(`/api/admin/audit?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setPagination(data.pagination);
            }
        } catch (error) {
            toast.error("Error fetching logs");
        } finally {
            setIsLoading(false);
        }
    }, [apiFetch, page, search, severity, category, status, startDate, endDate]);

    useEffect(() => {
        if (user && ["Admin", "Manager"].includes(user.role)) {
            fetchLogs();
        }
    }, [fetchLogs, user]);

    const resetFilters = () => {
        setSearch("");
        setSeverity("All");
        setCategory("All");
        setStatus("All");
        setStartDate("");
        setEndDate("");
        setPage(1);
    };

    return {
        user,
        logs,
        pagination,
        isLoading,
        selectedLog, setSelectedLog,
        search, setSearch,
        severity, setSeverity,
        category, setCategory,
        status, setStatus,
        startDate, setStartDate,
        endDate, setEndDate,
        page, setPage,
        fetchLogs,
        resetFilters
    };
};
