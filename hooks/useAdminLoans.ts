import { useState, useEffect } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import toast from "react-hot-toast";

export const useAdminLoans = () => {
    const { apiFetch } = useAuthContext();
    const [pendingLoans, setPendingLoans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewLoan, setReviewLoan] = useState<any | null>(null);

    const fetchPending = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/admin/loans");
            if (res.ok) {
                const data = await res.json();

                const sanitized = (data.loans || []).map((loan: any) => ({
                    ...loan,
                    principalAmount: loan.principalAmount?.$numberDecimal
                        ? Number(loan.principalAmount.$numberDecimal)
                        : Number(loan.principalAmount || 0),
                    emiAmount: loan.emiAmount?.$numberDecimal
                        ? Number(loan.emiAmount.$numberDecimal)
                        : Number(loan.emiAmount || 0),
                    interestRate: loan.interestRate?.$numberDecimal
                        ? Number(loan.interestRate.$numberDecimal)
                        : Number(loan.interestRate || 0),
                }));

                setPendingLoans(sanitized);
            }
        } catch (err) {
            console.error("Failed to load admin loans", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (
        loanId: string,
        status: "Approved" | "Rejected",
    ) => {
        try {
            const res = await apiFetch("/api/admin/loans", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loanId, status }),
            });

            if (res.ok) {
                fetchPending();
                setReviewLoan(null);
                toast.success(`Loan ${status} successfully!`);
            } else {
                toast.error("Failed to process loan.");
            }
        } catch (err) {
            toast.error("Action failed.");
        }
    };

    return {
        pendingLoans,
        isLoading,
        reviewLoan,
        setReviewLoan,
        handleAction,
        fetchPending,
    };
};
