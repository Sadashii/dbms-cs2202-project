"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import EmiCalculator from "@/components/EmiCalculator";
import toast from "react-hot-toast";

interface Loan {
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

interface LoanPayment {
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

export default function LoansPage() {
    const {
        user,
        apiFetch,
        isLoading: authLoading,
        isLoggedIn,
    } = useAuthContext();
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
                data.loans.forEach((loan: Loan) => {
                    fetchPayments(loan._id);
                });
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
        const currentDate = loan.nextPaymentDate
            ? new Date(loan.nextPaymentDate)
            : new Date();
        if (!loan.nextPaymentDate)
            currentDate.setMonth(currentDate.getMonth() + 1);

        for (let i = 1; i <= loan.tenureMonths; i++) {
            const interestForMonth = balance * monthlyRate;
            let principalForMonth = loan.emiAmount - interestForMonth;
            if (i === loan.tenureMonths || balance <= principalForMonth)
                principalForMonth = balance;
            balance -= principalForMonth;

            schedule.push({
                month: i,
                date: currentDate.toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                }),
                emi: principalForMonth + interestForMonth,
                principal: principalForMonth,
                interest: interestForMonth,
                balance: Math.max(0, balance),
            });
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return schedule;
    };

    const handleRepay = async (
        loanId: string,
        paymentId: string,
        type: "EMI" | "FORECLOSE",
    ) => {
        if (isProcessing) return;
        if (
            !confirm(
                `Are you sure you want to ${type === "EMI" ? "pay your monthly installment" : "foreclose the entire loan"}?`,
            )
        )
            return;
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
        } catch (error) {
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

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12 transition-colors">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">
                        Your Loans
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage repayments, view schedules, and apply for new
                        credit.
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={() =>
                        document
                            .getElementById("loan-tool")
                            ?.scrollIntoView({ behavior: "smooth" })
                    }
                >
                    Apply for a Loan
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2 transition-colors">
                        Active Accounts
                    </h2>

                    {isLoading ? (
                        <div className="py-20 flex justify-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : loans.length === 0 ? (
                        <div className="py-16 text-center bg-white dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-700 rounded-2xl transition-colors">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                                No active loans found
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">
                                Start your journey by calculating an EMI and
                                submitting an application.
                            </p>
                            <Button
                                onClick={() =>
                                    document
                                        .getElementById("loan-tool")
                                        ?.scrollIntoView({ behavior: "smooth" })
                                }
                            >
                                Get Started
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {loans.map((loan) => {
                                const progress =
                                    ((loan.principalAmount -
                                        loan.remainingAmount) /
                                        loan.principalAmount) *
                                    100;
                                const isApproved = [
                                    "Approved",
                                    "Active",
                                ].includes(loan.currentStatus);

                                return (
                                    <div
                                        key={loan._id}
                                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md"
                                    >
                                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {loan.loanType} Loan{" "}
                                                    {loan.loanReason && (
                                                        <span className="text-sm font-normal text-gray-500 ml-1">
                                                            ({loan.loanReason})
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-xs font-mono text-gray-400 mt-1">
                                                    Ref: {loan.loanReference}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                                    isApproved
                                                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30"
                                                        : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/30"
                                                }`}
                                            >
                                                {loan.currentStatus}
                                            </span>
                                        </div>

                                        <div className="p-6 bg-gray-50/50 dark:bg-slate-800/30 space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase">
                                                        Remaining Balance
                                                    </p>
                                                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                                                        ₹
                                                        {loan.remainingAmount.toLocaleString(
                                                            "en-IN",
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-gray-400 uppercase">
                                                        EMI Amount
                                                    </p>
                                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                                        ₹
                                                        {loan.emiAmount.toLocaleString(
                                                            "en-IN",
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                                    <span>
                                                        {progress.toFixed(1)}%
                                                        Repaid
                                                    </span>
                                                    <span>
                                                        {loan.interestRate}%
                                                        Interest
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                                        style={{
                                                            width: `${progress}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                                                        Next Due
                                                    </p>
                                                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                                                        {loan.nextPaymentDate
                                                            ? new Date(
                                                                  loan.nextPaymentDate,
                                                              ).toLocaleDateString(
                                                                  "en-IN",
                                                                  {
                                                                      month: "short",
                                                                      day: "2-digit",
                                                                      year: "numeric",
                                                                  },
                                                              )
                                                            : "Pending Approval"}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-[10px] uppercase font-bold dark:border-slate-700 dark:text-white"
                                                        onClick={() =>
                                                            setHistoryLoan(loan)
                                                        }
                                                    >
                                                        History
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-[10px] uppercase font-bold dark:border-slate-700 dark:text-white"
                                                        onClick={() =>
                                                            setScheduleLoan(
                                                                loan,
                                                            )
                                                        }
                                                    >
                                                        Schedule
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {isApproved && (
                                            <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
                                                {payments[loan._id]?.some(
                                                    (p) =>
                                                        p.currentStatus ===
                                                        "Pending",
                                                ) ? (
                                                    <div className="flex items-center justify-between gap-4">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                            Active Invoice Due:{" "}
                                                            <span className="text-red-600">
                                                                ₹
                                                                {payments[
                                                                    loan._id
                                                                ]
                                                                    ?.find(
                                                                        (p) =>
                                                                            p.currentStatus ===
                                                                            "Pending",
                                                                    )
                                                                    ?.amountExpected.toLocaleString()}
                                                            </span>
                                                        </p>
                                                        <Button
                                                            size="sm"
                                                            className="bg-red-600 hover:bg-red-700"
                                                            onClick={() =>
                                                                handleRepay(
                                                                    loan._id,
                                                                    payments[
                                                                        loan._id
                                                                    ]?.find(
                                                                        (p) =>
                                                                            p.currentStatus ===
                                                                            "Pending",
                                                                    )?._id ||
                                                                        "",
                                                                    "EMI",
                                                                )
                                                            }
                                                            isLoading={
                                                                isProcessing ===
                                                                loan._id
                                                            }
                                                        >
                                                            Pay EMI
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-500">
                                                            No pending dues at
                                                            the moment.
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-[10px] text-blue-600"
                                                            onClick={() =>
                                                                handleSimulateBilling(
                                                                    loan._id,
                                                                )
                                                            }
                                                            isLoading={
                                                                isProcessing ===
                                                                loan._id
                                                            }
                                                        >
                                                            Simulate Billing
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b dark:border-slate-800 pb-2 transition-colors">
                        Loan Tools
                    </h2>
                    <EmiCalculator onApplySuccess={fetchLoans} />
                </div>
            </div>

            {}
            {scheduleLoan && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col border dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                            <h3 className="text-xl font-bold dark:text-white">
                                Amortization Schedule
                            </h3>
                            <button
                                onClick={() => setScheduleLoan(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-gray-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-gray-500">
                                    <tr>
                                        <th className="p-4">Month</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4 text-right">EMI</th>
                                        <th className="p-4 text-right">
                                            Principal
                                        </th>
                                        <th className="p-4 text-right">
                                            Interest
                                        </th>
                                        <th className="p-4 text-right">
                                            Balance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-800">
                                    {generateSchedule(scheduleLoan).map(
                                        (row) => (
                                            <tr
                                                key={row.month}
                                                className="text-sm dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                                            >
                                                <td className="p-4">
                                                    {row.month}
                                                </td>
                                                <td className="p-4 font-medium">
                                                    {row.date}
                                                </td>
                                                <td className="p-4 text-right font-mono">
                                                    ₹
                                                    {Math.round(
                                                        row.emi,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-right text-green-500 font-mono">
                                                    ₹
                                                    {Math.round(
                                                        row.principal,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-right text-red-400 font-mono">
                                                    ₹
                                                    {Math.round(
                                                        row.interest,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-right font-bold dark:text-white font-mono">
                                                    ₹
                                                    {Math.round(
                                                        row.balance,
                                                    ).toLocaleString()}
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {}
            {historyLoan && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col border dark:border-slate-800">
                        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                            <h3 className="text-xl font-bold dark:text-white">
                                Transaction History
                            </h3>
                            <button
                                onClick={() => setHistoryLoan(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            {payments[historyLoan._id]?.filter(
                                (p) => p.currentStatus !== "Pending",
                            ).length === 0 ? (
                                <div className="py-20 text-center text-gray-500">
                                    No payment records found.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {payments[historyLoan._id]
                                        .filter(
                                            (p) =>
                                                p.currentStatus !== "Pending",
                                        )
                                        .map((p) => (
                                            <div
                                                key={p._id}
                                                className="p-4 rounded-xl border dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/20"
                                            >
                                                <div>
                                                    <p className="text-xs font-mono text-gray-500">
                                                        {p.paymentReference}
                                                    </p>
                                                    <p className="text-sm font-bold dark:text-white">
                                                        {p.paidDate
                                                            ? new Date(
                                                                  p.paidDate,
                                                              ).toLocaleDateString()
                                                            : "N/A"}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-green-600">
                                                        ₹
                                                        {p.amountPaid.toLocaleString()}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 uppercase">
                                                        Paid via Auto-Debit
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
