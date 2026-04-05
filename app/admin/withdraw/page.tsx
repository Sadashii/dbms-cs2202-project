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
        const loadingToast = toast.loading("Verifying account...");

        try {
            const response = await apiFetch(`/api/admin/accounts/${accountNumber.trim()}`);
            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Account not found.", { id: loadingToast });
                return;
            }

            if (data.account.currentStatus !== 'Active') {
                toast.error("Account is not active and cannot process withdrawals.", { id: loadingToast });
                return;
            }

            setAccountDetails(data.account);
            toast.success("Account verified successfully.", { id: loadingToast });
            setStep(2);
        } catch (error: any) {
            toast.error("Failed to verify account.", { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error("Please enter a valid amount greater than 0.");
            return;
        }

        // Pre-flight check for sufficient funds based on verified data
        if (accountDetails && parsedAmount > accountDetails.balance) {
            toast.error(`Insufficient funds. Max available: ${accountDetails.balance}`);
            return;
        }

        setIsLoading(true);
        const loadingToast = toast.loading("Processing withdrawal...");

        try {
            const response = await apiFetch("/api/admin/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: "withdrawal",
                    accountNumber: accountNumber.trim(),
                    amount: parsedAmount.toString(),
                    memo: memo.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Failed to process withdrawal.", { id: loadingToast });
                return;
            }

            toast.success(`Withdrawal successful! New Balance: ${data.newBalance}`, { id: loadingToast });
            
            // Reset for next transaction
            setAccountNumber("");
            setAccountDetails(null);
            setAmount("");
            setMemo("");
            setStep(1);
        } catch (error: any) {
            toast.error("An unexpected error occurred.", { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-8">
            <Toaster position="top-right" />
            
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Withdraw Funds</h1>
                    <p className="mt-2 text-gray-600">
                        Securely withdraw funds from a customer's account. This action will deduct from their balance.
                    </p>
                </div>
                {step === 2 && (
                    <button 
                        onClick={() => { setStep(1); setAccountDetails(null); }}
                        className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-amber-50 border-b border-amber-100 p-5 md:p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V4m-8 8h16" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-amber-900">
                            {step === 1 ? "Step 1: Verify Account" : "Step 2: Transaction Details"}
                        </h2>
                    </div>
                </div>

                {step === 1 && (
                    <form onSubmit={handleVerifyAccount} className="p-6 md:p-8 space-y-6">
                        <div className="space-y-2 max-w-lg">
                            <label className="text-sm font-medium text-gray-700">Customer Account Number</label>
                            <input
                                type="text"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                                placeholder="Enter exact account number"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="pt-4 flex justify-end max-w-lg border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`px-8 py-3 rounded-xl font-medium text-white transition-all w-full md:w-auto ${
                                    isLoading 
                                    ? 'bg-amber-400 cursor-not-allowed' 
                                    : 'bg-amber-600 hover:bg-amber-700 hover:shadow-md active:scale-95'
                                }`}
                            >
                                {isLoading ? "Searching..." : "Verify Account"}
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && accountDetails && (
                    <form onSubmit={handleWithdraw} className="p-6 md:p-8 space-y-6 animate-fade-in">
                        {/* Account Info Card */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
                            <h3 className="text-sm uppercase tracking-wide font-semibold text-gray-500 mb-4">Confirmed Recipient Details</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Account Holder</p>
                                    <p className="font-semibold text-gray-900">
                                        {accountDetails.userId?.firstName} {accountDetails.userId?.lastName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Account Number</p>
                                    <p className="font-semibold text-gray-900 font-mono">{accountDetails.accountNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Type</p>
                                    <p className="font-semibold text-gray-900">{accountDetails.accountType}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Available Balance</p>
                                    <p className="font-bold text-green-700">
                                        {accountDetails.currency} {accountDetails.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Withdrawal Amount ({accountDetails.currency})</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">
                                            {accountDetails.currency === 'INR' ? '₹' : accountDetails.currency === 'USD' ? '$' : '€'}
                                        </span>
                                    </div>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-8 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-amber-50/30 font-mono text-red-700"
                                        placeholder="0.00"
                                        min="0.01"
                                        step="0.01"
                                        max={accountDetails.balance}
                                        disabled={isLoading}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Memo / Description</label>
                                <input
                                    type="text"
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                                    placeholder="e.g. Cash withdrawal"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {parseFloat(amount) > accountDetails.balance && (
                            <p className="text-sm text-red-600 font-medium animate-pulse">
                                Exact withdrawal amount exceeds available balance.
                            </p>
                        )}

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading || parseFloat(amount) > accountDetails.balance}
                                className={`px-8 py-3 rounded-xl font-medium text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                                    isLoading || parseFloat(amount) > accountDetails.balance
                                    ? 'bg-amber-400 cursor-not-allowed' 
                                    : 'bg-amber-600 hover:bg-amber-700 hover:shadow-md'
                                }`}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    "Confirm & Withdraw"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
            
            {step === 1 && (
                <div className="mt-8 bg-red-50 border border-red-100 rounded-xl p-5 flex items-start gap-4">
                    <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm text-red-800">
                        <h3 className="font-semibold mb-1">Verify Account Carefully</h3>
                        <p>This action is destructive and modifies the user's ledger instantly. You will first confirm the account holder's name and available balance securely.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
