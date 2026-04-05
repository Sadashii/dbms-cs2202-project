"use client";

import React, { useState } from 'react';
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

interface EmiCalculatorProps {
    onApplySuccess?: () => void;
}

export default function EmiCalculator({ onApplySuccess }: EmiCalculatorProps) {
    const { user, apiFetch } = useAuthContext(); 
    
    const [principal, setPrincipal] = useState(160000);
    const [tenure, setTenure] = useState(12);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPopup, setShowPopup] = useState(false); 

    const BANK_INTEREST_RATE = 9.5; 

    const calculateEMI = () => {
        const r = BANK_INTEREST_RATE / 12 / 100;
        const n = tenure;
        if (r === 0) return principal / n;
        const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        return Math.round(emi);
    };

    const handleApply = async () => {
        setIsSubmitting(true);
        try {
            const res = await apiFetch("/api/loans", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    // Changed .id to ._id to match your UserPayload type
                    "x-user-id": (user as any)?._id || "" 
                },
                body: JSON.stringify({
                    principalAmount: principal,
                    tenureMonths: tenure,
                    emiAmount: calculateEMI(),
                    loanType: "Personal"
                })
            });

            if (res.ok) {
                if (onApplySuccess) onApplySuccess();
                setShowPopup(true); 
            } else {
                const errorData = await res.json();
                alert("Backend Error: " + errorData.error);
            }
        } catch (error) {
            console.error("Application failed", error);
            alert("Network error. Check your console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div id="loan-tool" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick EMI Calculator</h3>
                
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6">
                    <span className="text-sm font-medium text-gray-600">Applicable Interest Rate</span>
                    <span className="font-bold text-blue-600">{BANK_INTEREST_RATE}% p.a.</span>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                            <span>Loan Amount</span>
                            <span className="font-bold text-blue-600">₹{principal.toLocaleString('en-IN')}</span>
                        </label>
                        <input 
                            type="range" 
                            min="10000" 
                            max="1000000" 
                            step="10000"
                            value={principal}
                            onChange={(e) => setPrincipal(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    <div>
                        <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                            <span>Tenure</span>
                            <span className="font-bold text-blue-600">{tenure} months</span>
                        </label>
                        <input 
                            type="range" 
                            min="6" 
                            max="60" 
                            step="6"
                            value={tenure}
                            onChange={(e) => setTenure(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-between items-end mb-4">
                        <p className="text-sm font-medium text-gray-500">Estimated Monthly EMI</p>
                        <p className="text-3xl font-bold text-gray-900">₹{calculateEMI().toLocaleString('en-IN')}</p>
                    </div>

                    <Button 
                        variant="primary" 
                        className="w-full" 
                        onClick={handleApply}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : `Apply for ₹${principal.toLocaleString('en-IN')} Loan`}
                    </Button>
                </div>
            </div>

            {showPopup && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center mx-4">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
                        <p className="text-gray-500 mb-8">
                            You have successfully applied for a loan. Waiting for the admin reply.
                        </p>
                        <Button 
                            variant="primary" 
                            className="w-full py-3" 
                            onClick={() => setShowPopup(false)}
                        >
                            Got it
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}