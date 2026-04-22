import { useState, useEffect } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export interface Loan {
    _id: string;
    loanReference: string;
    loanType: string;
    loanReason?: string;
    loanDescription?: string;
    principalAmount: number;
    remainingAmount: number;
    emiAmount: number;
    interestRate: number;
    tenureMonths: number;
    currency: string;
    currentStatus: string;
    nextPaymentDate?: string;
    accountId: string;
}

export interface LoanPayment {
    _id: string;
    paymentReference: string;
    amountExpected: number;
    amountPaid: number;
    principalComponent: number;
    interestComponent: number;
    lateFeeComponent: number;
    dueDate: string;
    paidDate?: string;
    currentStatus: string;
}

export const useLoans = () => {
    const { user, apiFetch, isLoading: authLoading, isLoggedIn } = useAuthContext();
    const router = useRouter();

    const [loans, setLoans] = useState<Loan[]>([]);
    const [payments, setPayments] = useState<Record<string, LoanPayment[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [scheduleLoan, setScheduleLoan] = useState<Loan | null>(null);
    const [historyLoan, setHistoryLoan] = useState<Loan | null>(null);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) router.push("/auth/login");
    }, [authLoading, isLoggedIn, router]);

    const fetchPayments = async (loanId: string) => {
        try {
            const res = await apiFetch(`/api/loans/payments?loanId=${loanId}`);
            if (res.ok) {
                const data = await res.json();
                setPayments((prev) => ({ ...prev, [loanId]: data.payments }));
            }
        } catch (error) {
            console.error("Failed to fetch payments", error);
        }
    };

    const fetchLoans = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/loans");
            if (res.ok) {
                const data = await res.json();
                setLoans(data.loans || []);
                data.loans.forEach((loan: Loan) => fetchPayments(loan._id));
            }
        } catch (error) {
            console.error("Failed to fetch loans", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchLoans();
    }, [apiFetch, user]);

    const generateSchedule = (loan: Loan) => {
        let balance = loan.principalAmount;
        const monthlyRate = loan.interestRate / 12 / 100;
        const schedule = [];
        const currentDate = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : new Date();
        if (!loan.nextPaymentDate) currentDate.setMonth(currentDate.getMonth() + 1);

        for (let i = 1; i <= loan.tenureMonths; i++) {
            const interestForMonth = balance * monthlyRate;
            let principalForMonth = loan.emiAmount - interestForMonth;
            if (i === loan.tenureMonths || balance <= principalForMonth) principalForMonth = balance;
            balance -= principalForMonth;
            schedule.push({
                month: i,
                date: currentDate.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }),
                emi: principalForMonth + interestForMonth,
                principal: principalForMonth,
                interest: interestForMonth,
                balance: Math.max(0, balance),
            });
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return schedule;
    };

    const handleRepay = async (loanId: string, paymentId: string, type: "EMI" | "FORECLOSE") => {
        if (isProcessing) return;
        if (!confirm(`Are you sure you want to ${type === "EMI" ? "pay your monthly installment" : "foreclose the entire loan"}?`)) return;
        setIsProcessing(loanId);
        try {
            const res = await apiFetch("/api/loans/repay", {
                method: "POST",
                body: JSON.stringify({ loanId, paymentId, type }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`${type} Repayment Successful!`);
                await fetchLoans();
            } else {
                toast.error(data.message || "Failed to process repayment.");
            }
        } catch {
            toast.error("Network error during repayment.");
        } finally {
            setIsProcessing(null);
        }
    };

    const handleSimulateBilling = async (loanId: string) => {
        setIsProcessing(loanId);
        try {
            const res = await apiFetch("/api/loans/payments", {
                method: "POST",
                body: JSON.stringify({ loanId }),
            });
            if (res.ok) {
                toast.success("EMI Billed Successfully!");
                await fetchPayments(loanId);
                await fetchLoans();
            }
        } catch (error) {
            console.error("Billing error", error);
        } finally {
            setIsProcessing(null);
        }
    };

    return {
        loans, payments, isLoading, authLoading,
        isProcessing, scheduleLoan, setScheduleLoan,
        historyLoan, setHistoryLoan,
        fetchLoans, generateSchedule,
        handleRepay, handleSimulateBilling,
    };
};
