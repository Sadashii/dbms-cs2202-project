"use client";

import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useAuthContext } from "@/components/AuthProvider";

export default function AdminDepositPage() {
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
            const response = await apiFetch(`/api/admin/accounts/${accountNumber.trim()}`);
            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Account not found.", { id: loadingToast });
                return;
            }

            if (data.account.currentStatus !== 'Active') {
                toast.error("Account restricted from credit operations.", { id: loadingToast });
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

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error("Invalid amount.");
            return;
        }

        setIsLoading(true);
        const loadingToast = toast.loading("Processing deposit protocol...");

        try {
            const response = await apiFetch("/api/admin/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "deposit",
                    accountNumber: accountNumber.trim(),
                    amount: parsedAmount.toString(),
                    memo: memo.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Protocol failure.", { id: loadingToast });
                return;
            }

            toast.success(`Success! New Balance: ${data.newBalance}`, { id: loadingToast });
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
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Deposit Protocol</h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Execute direct credit operations for validated customer accounts.
                        </p>
                    </div>
                    {step === 2 && (
                        <button 
                            onClick={() => { setStep(1); setAccountDetails(null); }}
                            className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            Back to Verify
                        </button>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
                    {/* Step Indicator Header */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-800/30 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-700 dark:text-emerald-400 shadow-sm">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-tight">
                                    {step === 1 ? "01: Verification" : "02: Execution"}
                                </h2>
                                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-600 uppercase tracking-widest">
                                    {step === 1 ? "Scan network for principal" : "Confirm credit value"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleVerifyAccount} className="p-8 md:p-12 space-y-8">
                            <div className="space-y-3 max-w-lg">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Account ID</label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="VP-XXXX-XXXX-XXXX"
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white transition-all w-full md:w-auto shadow-lg shadow-emerald-500/20 ${
                                        isLoading ? 'bg-emerald-400 cursor-not-allowed opacity-50' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                                    }`}
                                >
                                    {isLoading ? "Validating..." : "Execute Verification"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleDeposit} className="p-8 md:p-12 space-y-8 animate-fade-in">
                            {/* Summary Card */}
                            <div className="bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-[1.5rem] p-6">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">Verified Recipient Metadata</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">Principal</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white">
                                            {accountDetails.userId?.firstName} {accountDetails.userId?.lastName}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">Registry ID</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white font-mono uppercase">{accountDetails.accountNumber}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">Asset Class</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white">{accountDetails.accountType}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">Liquidity</p>
                                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                            {accountDetails.currency} {accountDetails.balance.toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Value to Credit ({accountDetails.currency})</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full pl-6 pr-4 py-4 text-2xl font-black bg-emerald-50/30 dark:bg-emerald-950/20 border border-gray-200 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-300"
                                            placeholder="0.00"
                                            min="0.01"
                                            step="0.01"
                                            disabled={isLoading}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Transaction Memo</label>
                                    <input
                                        type="text"
                                        value={memo}
                                        onChange={(e) => setMemo(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="Enter forensic reason..."
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white transition-all shadow-xl flex items-center justify-center gap-3 ${
                                        isLoading 
                                        ? 'bg-emerald-400 cursor-not-allowed opacity-50' 
                                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 active:scale-95'
                                    }`}
                                >
                                    {isLoading ? "Processing Protocol..." : "Authorize Deposit"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                
                {step === 1 && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-3xl p-6 flex items-start gap-5 transition-colors">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                             <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="text-sm">
                            <h3 className="font-black uppercase tracking-wider text-blue-900 dark:text-blue-400 mb-1">Audit Compliance</h3>
                            <p className="text-blue-800 dark:text-blue-500/80 font-medium leading-relaxed">
                                Executing an unverified credit injection is a critical protocol breach. Always validate the recipient metadata before committing funds to the ledger.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}