import { useState, useEffect } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export interface DashboardData {
    summary: {
        totalBalance: number;
        activeAccountsCount: number;
        totalLoanOutstanding: number;
        activeLoansCount: number;
        activeCardsCount: number;
        nextEmiDue: { amount: number; date: string; type: string } | null;
    };
    accounts: Array<{
        _id: string;
        accountNumber: string;
        accountType: string;
        balance: number;
        currency: string;
        currentStatus: string;
    }>;
    recentTransactions: Array<{
        _id: string;
        entryType: "Credit" | "Debit";
        amount: number;
        balanceAfter: number;
        memo?: string;
        createdAt: string;
        transactionId?: { referenceId?: string; type?: string };
    }>;
}

export const useOverview = () => {
    const {
        user,
        apiFetch,
        isLoading: authLoading,
        isLoggedIn,
    } = useAuthContext();
    const router = useRouter();

    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [show2FAPrompt, setShow2FAPrompt] = useState(false);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) router.push("/auth/login");
    }, [authLoading, isLoggedIn, router]);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const res = await apiFetch("/api/dashboard");
                if (res.ok) setData(await res.json());
            } catch (e) {
                console.error("Dashboard fetch failed", e);
            } finally {
                setIsLoading(false);
            }
        })();

        if (
            !user.isTwoFactorEnabled &&
            !sessionStorage.getItem("2fa_prompted")
        ) {
            setShow2FAPrompt(true);
        }
    }, [user, apiFetch]);

    const isNewUser =
        !isLoading && (!data?.accounts || data.accounts.length === 0);

    const fmt = (n: number, cur = "INR") =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: cur,
            maximumFractionDigits: 0,
        }).format(n);

    return {
        user,
        data,
        isLoading,
        authLoading,
        show2FAPrompt,
        setShow2FAPrompt,
        isNewUser,
        fmt,
        router,
        apiFetch,
    };
};
