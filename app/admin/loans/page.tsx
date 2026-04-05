"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

export default function AdminLoansPage() {
    const { apiFetch } = useAuthContext();
    const [pendingLoans, setPendingLoans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPending = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/admin/loans");
            if (res.ok) {
                const data = await res.json();
                
                // SANITIZE DATA: Fix the [object Object] issue
                const sanitized = (data.loans || []).map((loan: any) => ({
                    ...loan,
                    principalAmount: loan.principalAmount?.$numberDecimal 
                        ? Number(loan.principalAmount.$numberDecimal) 
                        : Number(loan.principalAmount || 0)
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
                // Refresh the list - the approved loan will disappear from here 
                // because this list only shows "Applied" loans.
                fetchPending(); 
                alert(`Loan ${status} successfully!`);
            }
        } catch (err) {
            alert("Action failed. Check console.");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Pending Loan Requests</h1>
                <p className="text-gray-500">Review and process customer loan applications.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={4} className="p-10 text-center text-gray-400">Loading...</td></tr>
                        ) : pendingLoans.length === 0 ? (
                            <tr><td colSpan={4} className="p-10 text-center text-gray-400">No pending requests.</td></tr>
                        ) : (
                            pendingLoans.map((loan: any) => (
                                <tr key={loan._id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">
                                            {/* Accessing the populated user name */}
                                            {loan.userId?.name || "User ID: " + loan.userId?._id?.substring(0,8)}
                                        </div>
                                        <div className="text-xs text-gray-500">{loan.userId?.email || 'No email'}</div>
                                    </td>
                                    <td className="p-4 text-gray-600">{loan.loanType}</td>
                                    <td className="p-4 font-bold text-gray-900">
                                        ₹{loan.principalAmount.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        <Button 
                                            onClick={() => handleAction(loan._id, 'Approved')} 
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            Approve
                                        </Button>
                                        <Button 
                                            onClick={() => handleAction(loan._id, 'Rejected')} 
                                            variant="outline" 
                                            className="text-red-600 border-red-200"
                                        >
                                            Reject
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}