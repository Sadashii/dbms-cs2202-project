import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export const useAccountDetail = () => {
    const { apiFetch, isLoading: authLoading, isLoggedIn } = useAuthContext();
    const params = useParams();
    const router = useRouter();

    const [account, setAccount] = useState<any>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [entryTypeFilter, setEntryTypeFilter] = useState("All");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 20;

    useEffect(() => {
        if (!authLoading && !isLoggedIn) router.push("/auth/login");
    }, [authLoading, isLoggedIn, router]);

    useEffect(() => {
        setPage(1);
    }, [entryTypeFilter, startDate, endDate]);

    const fetchHistory = useCallback(async () => {
        if (!params.accountId) return;
        setIsLoading(true);
        try {
            const qs = new URLSearchParams({
                page: String(page),
                limit: String(LIMIT),
                ...(entryTypeFilter !== "All" && { type: entryTypeFilter }),
                ...(startDate && { start: startDate }),
                ...(endDate && { end: endDate }),
            });

            const res = await apiFetch(
                `/api/accounts/${params.accountId}/transactions?${qs}`,
            );
            if (res.ok) {
                const data = await res.json();
                setAccount(data.account);
                setEntries(data.transactions);
                setTotalPages(data.pagination?.totalPages ?? 1);
                setTotal(data.pagination?.total ?? data.transactions.length);
            } else {
                toast.error("Failed to fetch transaction history");
            }
        } catch {
            toast.error("Network error while fetching history");
        } finally {
            setIsLoading(false);
        }
    }, [apiFetch, params.accountId, page, entryTypeFilter, startDate, endDate]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const displayedEntries = searchQuery.trim()
        ? entries.filter((e) => {
              const q = searchQuery.toLowerCase();
              return (
                  e.memo?.toLowerCase().includes(q) ||
                  e.transactionId?.referenceId?.toLowerCase().includes(q) ||
                  e.transactionId?.type?.toLowerCase().includes(q)
              );
          })
        : entries;

    const symbol =
        account?.currency === "INR"
            ? "₹"
            : account?.currency === "USD"
              ? "$"
              : "€";

    return {
        account,
        entries,
        isLoading,
        authLoading,
        searchQuery,
        setSearchQuery,
        entryTypeFilter,
        setEntryTypeFilter,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        page,
        setPage,
        totalPages,
        total,
        displayedEntries,
        symbol,
        router,
    };
};
