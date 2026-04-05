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
        const loadingToast = toast.loading("Verifying account...");

        try {
            const response = await apiFetch(`/api/admin/accounts/${accountNumber.trim()}`);
            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Account not found.", { id: loadingToast });
                return;
            }

            if (data.account.currentStatus !== 'Active') {
                toast.error("Account is not active and cannot accept deposits.", { id: loadingToast });
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

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error("Please enter a valid amount greater than 0.");
            return;
        }

        setIsLoading(true);
        const loadingToast = toast.loading("Processing deposit...");

        try {
            const response = await apiFetch("/api/admin/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: "deposit",
                    accountNumber: accountNumber.trim(),
                    amount: parsedAmount.toString(),
                    memo: memo.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Failed to process deposit.", { id: loadingToast });
                return;
            }

            toast.success(`Deposit successful! New Balance: ${data.newBalance}`, { id: loadingToast });
            
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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Deposit Funds</h1>
                    <p className="mt-2 text-gray-600">
                        Securely deposit funds into a customer's account. This action will directly credit their balance.
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
                <div className="bg-green-50 border-b border-green-100 p-5 md:p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg text-green-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-green-900">
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
                                    ? 'bg-green-400 cursor-not-allowed' 
                                    : 'bg-green-600 hover:bg-green-700 hover:shadow-md active:scale-95'
                                }`}
                            >
                                {isLoading ? "Searching..." : "Verify Account"}
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && accountDetails && (
                    <form onSubmit={handleDeposit} className="p-6 md:p-8 space-y-6 animate-fade-in">
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
                                    <p className="text-xs text-gray-500">Current Balance</p>
                                    <p className="font-semibold text-gray-900">
                                        {accountDetails.currency} {accountDetails.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Deposit Amount ({accountDetails.currency})</label>
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
                                        className="w-full pl-8 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-green-50/30"
                                        placeholder="0.00"
                                        min="0.01"
                                        step="0.01"
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    placeholder="e.g. Cash deposit at branch #102"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`px-8 py-3 rounded-xl font-medium text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                                    isLoading 
                                    ? 'bg-green-400 cursor-not-allowed' 
                                    : 'bg-green-600 hover:bg-green-700 hover:shadow-md'
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
                                    "Confirm & Deposit"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
            
            {step === 1 && (
                <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4">
                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                        <h3 className="font-semibold mb-1">Verify Account Carefully</h3>
                        <p>Entering the incorrect account number may lead to funds being deposited into the wrong account. For staff integrity, you must preview and confirm the recipient's details first.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
