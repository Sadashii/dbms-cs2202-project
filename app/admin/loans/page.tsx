"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function AdminLoansPage() {
    const { apiFetch } = useAuthContext();
    const [pendingLoans, setPendingLoans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // NEW STATE: Tracks which loan is currently being viewed in the modal
    const [reviewLoan, setReviewLoan] = useState<any | null>(null);

    const fetchPending = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/admin/loans");
            if (res.ok) {
                const data = await res.json();
                
                // SANITIZE DATA: Fix the [object Object] issue for all Decimal128 fields
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
                        : Number(loan.interestRate || 0)
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

    const handleAction = async (loanId: string, status: 'Approved' | 'Rejected') => {
        try {
            const res = await apiFetch("/api/admin/loans", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loanId, status })
            });
            
            if (res.ok) {
                fetchPending(); 
                setReviewLoan(null); // Close the modal upon success
                toast.success(`Loan ${status} successfully!`);
            } else {
                toast.error("Failed to process loan.");
            }
        } catch (err) {
            toast.error("Action failed. Check console.");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Pending Loan Requests</h1>
                <p className="text-gray-500">Review and process customer loan applications.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Type & Purpose</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Terms</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-400">Loading applications...</td></tr>
                        ) : pendingLoans.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-16 text-center">
                                    <div className="text-gray-400 mb-2">No pending requests.</div>
                                    <p className="text-sm text-gray-400">All caught up! New applications will appear here.</p>
                                </td>
                            </tr>
                        ) : (
                            pendingLoans.map((loan: any) => (
                                <tr key={loan._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">
                                            {loan.userId?.name || "User ID: " + loan.userId?._id?.substring(0,8)}
                                        </div>
                                        <div className="text-xs text-gray-500">{loan.userId?.email || 'No email'}</div>
                                    </td>
                                    
                                    {/* UPDATED: Only shows specific reason if it exists, otherwise base type */}
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">
                                            {loan.loanReason && loan.loanReason !== "Personal" 
                                                ? loan.loanReason 
                                                : loan.loanType}
                                        </div>
                                    </td>
                                    
                                    <td className="p-4">
                                        <div className="text-sm text-gray-900">{loan.tenureMonths} Months</div>
                                        <div className="text-xs text-gray-500">₹{loan.emiAmount.toLocaleString('en-IN')}/mo</div>
                                    </td>

                                    <td className="p-4 font-bold text-gray-900 text-lg">
                                        ₹{loan.principalAmount.toLocaleString('en-IN')}
                                    </td>
                                    
                                    <td className="p-4">
                                        <Button 
                                            onClick={() => setReviewLoan(loan)} 
                                            variant="outline"
                                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                        >
                                            Review Details
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* The Review Modal */}
            {reviewLoan && (
                <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Review Application</h2>
                                <p className="text-xs text-gray-500 font-mono mt-1">REF: {reviewLoan.loanReference}</p>
                            </div>
                            <button 
                                onClick={() => setReviewLoan(null)} 
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                            {/* Applicant Info */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Applicant Profile</h3>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                        {(reviewLoan.userId?.name?.[0] || reviewLoan.userId?.email?.[0] || 'U').toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{reviewLoan.userId?.name || 'Unknown User'}</div>
                                        <div className="text-sm text-gray-500">{reviewLoan.userId?.email}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Details */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Requested Terms</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="border border-gray-100 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 mb-1">Principal Amount</div>
                                        <div className="font-bold text-gray-900 text-lg">₹{reviewLoan.principalAmount.toLocaleString('en-IN')}</div>
                                    </div>
                                    <div className="border border-gray-100 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 mb-1">Calculated EMI</div>
                                        <div className="font-bold text-gray-900 text-lg">₹{reviewLoan.emiAmount.toLocaleString('en-IN')}</div>
                                    </div>
                                    <div className="border border-gray-100 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 mb-1">Tenure</div>
                                        <div className="font-semibold text-gray-900">{reviewLoan.tenureMonths} Months</div>
                                    </div>
                                    <div className="border border-gray-100 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 mb-1">Interest Rate</div>
                                        <div className="font-semibold text-gray-900">{reviewLoan.interestRate}% p.a.</div>
                                    </div>
                                </div>
                            </div>

                            {/* Justification */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Justification</h3>
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                    {/* UPDATED: Only shows specific reason if it exists, otherwise base type */}
                                    <div className="font-semibold text-blue-900 mb-2">
                                        Category: {reviewLoan.loanReason && reviewLoan.loanReason !== "Personal" 
                                            ? reviewLoan.loanReason 
                                            : reviewLoan.loanType}
                                    </div>
                                    <div className="text-sm text-blue-800 leading-relaxed italic">
                                        {reviewLoan.loanDescription ? `"${reviewLoan.loanDescription}"` : "No additional description provided by the applicant."}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Footer */}
                        <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => handleAction(reviewLoan._id, 'Rejected')} 
                                className="w-1/3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            >
                                Reject
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={() => handleAction(reviewLoan._id, 'Approved')} 
                                className="w-2/3 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                            >
                                Approve Request
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}