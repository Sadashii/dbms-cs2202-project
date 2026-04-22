"use client";

import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useAuthContext } from "@/components/AuthProvider";

export default function AdminWithdrawPage() {
    const [step, setStep] = useState<1 | 2>(1);
    const [accountNumber, setAccountNumber] = useState("");
    const [accountDetails, setAccountDetails] = useState<any>(null);
    const [amount, setAmount] = useState("");
    const [memo, setMemo] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { apiFetch } = useAuthContext();

    const handleVerifyAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountNumber.trim()) {
            toast.error("Account Number is required.");
            return;
        }

        setIsLoading(true);
        const loadingToast = toast.loading("Verifying protocol...");

        try {
            const response = await apiFetch(
                `/api/admin/accounts/${accountNumber.trim()}`,
            );
            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Account not found.", {
                    id: loadingToast,
                });
                return;
            }

            if (data.account.currentStatus !== "Active") {
                toast.error("Account restricted from debit operations.", {
                    id: loadingToast,
                });
                return;
            }

            setAccountDetails(data.account);
            toast.success("Identity Verified.", { id: loadingToast });
            setStep(2);
        } catch (error: any) {
            toast.error("Verification failed.", { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error("Invalid amount.");
            return;
        }

        if (accountDetails && parsedAmount > accountDetails.balance) {
            toast.error(`Insufficient funds. Max: ${accountDetails.balance}`);
            return;
        }

        setIsLoading(true);
        const loadingToast = toast.loading("Processing withdrawal protocol...");

        try {
            const response = await apiFetch("/api/admin/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "withdrawal",
                    accountNumber: accountNumber.trim(),
                    amount: parsedAmount.toString(),
                    memo: memo.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Protocol failure.", {
                    id: loadingToast,
                });
                return;
            }

            toast.success(`Debit authorized! New Balance: ${data.newBalance}`, {
                id: loadingToast,
            });
            setAccountNumber("");
            setAccountDetails(null);
            setAmount("");
            setMemo("");
            setStep(1);
        } catch (error: any) {
            toast.error("Unexpected error occurred.", { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-8 transition-colors duration-500">
            <Toaster position="top-right" />

            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
                            Withdrawal Protocol
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Execute direct debit operations and balance
                            adjustments.
                        </p>
                    </div>
                    {step === 2 && (
                        <button
                            onClick={() => {
                                setStep(1);
                                setAccountDetails(null);
                            }}
                            className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Modify Target
                        </button>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
                    {}
                    <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-slate-800 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-700 dark:text-amber-400 shadow-sm">
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 20V4m-8 8h16"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight">
                                    {step === 1
                                        ? "Step 01: Identification"
                                        : "Step 02: Authorization"}
                                </h2>
                                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-600 uppercase tracking-widest">
                                    Debit Authorization Sequence
                                </p>
                            </div>
                        </div>
                    </div>

                    {step === 1 ? (
                        <form
                            onSubmit={handleVerifyAccount}
                            className="p-8 md:p-12 space-y-8"
                        >
                            <div className="space-y-3 max-w-lg">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                    Target Account ID
                                </label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) =>
                                        setAccountNumber(e.target.value)
                                    }
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Enter Protocol Reference..."
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white transition-all w-full md:w-auto shadow-lg shadow-amber-500/20 ${
                                        isLoading
                                            ? "bg-amber-400 cursor-not-allowed opacity-50"
                                            : "bg-amber-600 hover:bg-amber-700 active:scale-95"
                                    }`}
                                >
                                    {isLoading
                                        ? "Fetching..."
                                        : "Verify Registry"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form
                            onSubmit={handleWithdraw}
                            className="p-8 md:p-12 space-y-8 animate-fade-in"
                        >
                            <div className="bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-[1.5rem] p-6">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">
                                    Principal Metadata
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">
                                            Account Holder
                                        </p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white">
                                            {accountDetails.userId?.firstName}{" "}
                                            {accountDetails.userId?.lastName}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">
                                            Registry ID
                                        </p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white font-mono">
                                            {accountDetails.accountNumber}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">
                                            Class
                                        </p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white">
                                            {accountDetails.accountType}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">
                                            Liquidity
                                        </p>
                                        <p className="text-sm font-black text-amber-600 dark:text-amber-400">
                                            {accountDetails.currency}{" "}
                                            {accountDetails.balance.toLocaleString(
                                                "en-IN",
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                        Value to Deduct (
                                        {accountDetails.currency})
                                    </label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(e.target.value)
                                        }
                                        className="w-full px-6 py-4 text-2xl font-black bg-amber-50/30 dark:bg-amber-950/20 border border-gray-200 dark:border-slate-800 rounded-2xl text-red-600 dark:text-red-400 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono"
                                        placeholder="0.00"
                                        min="0.01"
                                        step="0.01"
                                        max={accountDetails.balance}
                                        disabled={isLoading}
                                        required
                                        autoFocus
                                    />
                                    {parseFloat(amount) >
                                        accountDetails.balance && (
                                        <p className="text-[10px] font-black text-red-600 uppercase tracking-tighter animate-pulse">
                                            Insufficient Liquidity in target
                                            Node
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                        Forensic Memo
                                    </label>
                                    <input
                                        type="text"
                                        value={memo}
                                        onChange={(e) =>
                                            setMemo(e.target.value)
                                        }
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                        placeholder="Reason for deduction..."
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={
                                        isLoading ||
                                        parseFloat(amount) >
                                            accountDetails.balance
                                    }
                                    className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white transition-all shadow-xl flex items-center justify-center gap-3 ${
                                        isLoading ||
                                        parseFloat(amount) >
                                            accountDetails.balance
                                            ? "bg-gray-300 dark:bg-slate-800 cursor-not-allowed grayscale"
                                            : "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20 active:scale-95"
                                    }`}
                                >
                                    {isLoading
                                        ? "Executing..."
                                        : "Authorize Withdrawal"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {step === 1 && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-3xl p-6 flex items-start gap-5 transition-colors">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                            <svg
                                className="w-6 h-6 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <div className="text-sm">
                            <h3 className="font-black uppercase tracking-wider text-red-900 dark:text-red-400 mb-1">
                                Destructive Action Alert
                            </h3>
                            <p className="text-red-800 dark:text-red-500/80 font-medium leading-relaxed">
                                Withdrawal operations immediately modify the
                                customer ledger. Verification of liquidity and
                                recipient identity is mandatory before
                                execution.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
