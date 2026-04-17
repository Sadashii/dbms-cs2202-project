"use client";

import React, { useState } from 'react';
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface EmiCalculatorProps {
    onApplySuccess?: () => void;
}

export default function EmiCalculator({ onApplySuccess }: EmiCalculatorProps) {
    const { user, apiFetch } = useAuthContext(); 
    
    const [principal, setPrincipal] = useState(160000);
    const [tenure, setTenure] = useState(12);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [showDetailsPopup, setShowDetailsPopup] = useState(false); 
    const [showSuccessPopup, setShowSuccessPopup] = useState(false); 
    
    const [loanReason, setLoanReason] = useState("Personal");
    const [loanDescription, setLoanDescription] = useState("");

    const [accounts, setAccounts] = useState<any[]>([]);
    const [linkedAccountId, setLinkedAccountId] = useState("");
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

    const BANK_INTEREST_RATE = 9.5; 

    React.useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await apiFetch("/api/accounts?limit=50");
                if (res.ok) {
                    const data = await res.json();
                    const activeAccounts = data.accounts.filter((a: any) => a.currentStatus === 'Active');
                    setAccounts(activeAccounts);
                    if (activeAccounts.length > 0) setLinkedAccountId(activeAccounts[0]._id);
                }
            } catch (error) {
                console.error("Failed to fetch accounts", error);
            } finally {
                setIsLoadingAccounts(false);
            }
        };
        if (user) fetchAccounts();
    }, [user, apiFetch]);

    const calculateEMI = () => {
        const r = BANK_INTEREST_RATE / 12 / 100;
        const n = tenure;
        if (r === 0) return principal / n;
        const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        return Math.round(emi);
    };

    const handleInitialApply = () => {
        setShowDetailsPopup(true);
    };

    const handleFinalSubmit = async () => {
        // CHANGE 1: Explicit validation before making the API call
        if (loanReason === "Other" && loanDescription.trim() === "") {
            toast.error("Please provide additional details for your loan purpose.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await apiFetch("/api/loans", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    principalAmount: principal,
                    tenureMonths: tenure,
                    emiAmount: calculateEMI(),
                    loanType: "Personal",
                    accountId: linkedAccountId,
                    loanReason: loanReason, 
                    loanDescription: loanDescription 
                })
            });

            if (res.ok) {
                if (onApplySuccess) onApplySuccess();
                setShowDetailsPopup(false); 
                setShowSuccessPopup(true); 
                
                setLoanDescription("");
                setLoanReason("Personal");
            } else {
                const errorData = await res.json();
                toast.error("Backend Error: " + errorData.error);
            }
        } catch (error) {
            console.error("Application failed", error);
            toast.error("Network error. Check your console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper variable for the disabled state
    const isConfirmDisabled = isSubmitting || (loanReason === "Other" && loanDescription.trim() === "");

    return (
        <>
            <div id="loan-tool" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 mt-6 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 transition-colors">Quick EMI Calculator</h3>
                
                <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700 mb-6 transition-colors">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Applicable Interest Rate</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{BANK_INTEREST_RATE}% p.a.</span>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                            <span>Loan Amount</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">₹{principal.toLocaleString('en-IN')}</span>
                        </label>
                        <input 
                            type="range" 
                            min="10000" 
                            max="1000000" 
                            step="10000"
                            value={principal}
                            onChange={(e) => setPrincipal(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">Linked Bank Account</label>
                        {isLoadingAccounts ? (
                            <div className="h-10 bg-gray-100 dark:bg-slate-800 animate-pulse rounded-lg transition-colors"></div>
                        ) : accounts.length === 0 ? (
                            <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800/30 transition-colors">
                                No active accounts found. Please register an account first.
                            </div>
                        ) : (
                            <select
                                className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm outline-none transition-colors"
                                value={linkedAccountId}
                                onChange={(e) => setLinkedAccountId(e.target.value)}
                                disabled={isSubmitting}
                            >
                                {accounts.map(acc => (
                                    <option key={acc._id} value={acc._id}>
                                        {acc.accountType} (****{acc.accountNumber.slice(-4)}) - ₹{acc.balance.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        )}
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 transition-colors">Funds will be disbursed to and EMIs deducted from this account.</p>
                    </div>

                    <div>
                        <label className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                            <span>Tenure</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{tenure} months</span>
                        </label>
                        <input 
                            type="range" 
                            min="6" 
                            max="60" 
                            step="6"
                            value={tenure}
                            onChange={(e) => setTenure(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 transition-colors"
                        />
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-between items-end mb-4 transition-colors">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors">Estimated Monthly EMI</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">₹{calculateEMI().toLocaleString('en-IN')}</p>
                    </div>

                    <Button 
                        variant="primary" 
                        className="w-full" 
                        onClick={handleInitialApply} 
                        disabled={accounts.length === 0}
                    >
                        Apply for ₹{principal.toLocaleString('en-IN')} Loan
                    </Button>
                </div>
            </div>

            {showDetailsPopup && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Application Details</h3>
                        <p className="text-sm text-gray-500 mb-6">Confirming a ₹{principal.toLocaleString('en-IN')} loan for {tenure} months.</p>
                        
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Loan</label>
                                <select 
                                    value={loanReason}
                                    onChange={(e) => setLoanReason(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option value="Personal">General Personal</option>
                                    <option value="Medical">Medical Emergency</option>
                                    <option value="Education">Education</option>
                                    <option value="Home Renovation">Home Renovation</option>
                                    <option value="Wedding">Wedding/Event</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                {/* CHANGE 2: Dynamic Label logic */}
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Additional Details 
                                    {loanReason === "Other" ? (
                                        <span className="text-red-500 ml-1">*</span>
                                    ) : (
                                        <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                                    )}
                                </label>
                                <textarea 
                                    value={loanDescription}
                                    onChange={(e) => setLoanDescription(e.target.value)}
                                    placeholder={loanReason === "Other" ? "Please specify your reason here..." : "Briefly describe why you need this loan to help speed up approval..."}
                                    className={`w-full border rounded-lg px-3 py-2 bg-white focus:ring-blue-500 focus:border-blue-500 outline-none h-24 resize-none ${loanReason === 'Other' && loanDescription.trim() === '' ? 'border-red-300' : 'border-gray-300'}`}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                className="w-1/3" 
                                onClick={() => setShowDetailsPopup(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            {/* CHANGE 3: Dynamic disabled state on the button */}
                            <Button 
                                variant="primary" 
                                className="w-2/3" 
                                onClick={handleFinalSubmit}
                                disabled={isConfirmDisabled} 
                            >
                                {isSubmitting ? "Submitting..." : "Confirm & Apply"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessPopup && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Application Submitted!</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 transition-colors">
                            You have successfully applied for a loan. Waiting for the admin reply.
                        </p>
                        <Button 
                            variant="primary" 
                            className="w-full py-3" 
                            onClick={() => setShowSuccessPopup(false)}
                        >
                            Got it
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}