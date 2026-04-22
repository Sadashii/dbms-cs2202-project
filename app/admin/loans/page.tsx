"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useAdminLoans } from "@/hooks/useAdminLoans";

export default function AdminLoansPage() {
    const { pendingLoans, isLoading, reviewLoan, setReviewLoan, handleAction } =
        useAdminLoans();

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
                        Pending Loan Requests
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Review and verify requests for incoming loan
                        applications.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[2rem] shadow-xl overflow-hidden transition-all">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px] border-collapse">
                            <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                                <tr>
                                    <th className="p-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        Customer
                                    </th>
                                    <th className="p-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        Purpose
                                    </th>
                                    <th className="p-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        Terms
                                    </th>
                                    <th className="p-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        Amount
                                    </th>
                                    <th className="p-5 text-right text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 transition-colors">
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="p-20 text-center"
                                        >
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                                        </td>
                                    </tr>
                                ) : pendingLoans.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="p-20 text-center text-gray-300 dark:text-slate-700 font-black italic uppercase tracking-widest"
                                        >
                                            Queue Clear: No Pending Requests
                                        </td>
                                    </tr>
                                ) : (
                                    pendingLoans.map((loan: any) => (
                                        <tr
                                            key={loan._id}
                                            className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 group transition-all"
                                        >
                                            <td className="p-5">
                                                <div className="font-black text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                                                    {loan.userId?.firstName}{" "}
                                                    {loan.userId?.lastName ||
                                                        loan.userId?.name ||
                                                        "Ref: " +
                                                            loan.userId?._id?.substring(
                                                                0,
                                                                8,
                                                            )}
                                                </div>
                                                <div className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                                                    {loan.userId?.email}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase border border-blue-100 dark:border-blue-800/30">
                                                    {loan.loanReason ||
                                                        loan.loanType}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {loan.tenureMonths} Months
                                                </div>
                                                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                                    ₹
                                                    {loan.emiAmount.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                    /mo
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="text-lg font-black text-gray-900 dark:text-white">
                                                    ₹
                                                    {loan.principalAmount.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <Button
                                                    onClick={() =>
                                                        setReviewLoan(loan)
                                                    }
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-[10px] font-black uppercase py-1.5 h-auto rounded-xl dark:border-slate-700 dark:text-white"
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
                </div>
            </div>

            {reviewLoan && (
                <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-800 transition-colors">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                    Review Application
                                </h2>
                                <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-widest">
                                    REF: {reviewLoan.loanReference}
                                </p>
                            </div>
                            <button
                                onClick={() => setReviewLoan(null)}
                                className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="3"
                                        d="M6 18L18 6M6 6l12 12"
                                    ></path>
                                </svg>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto max-h-[60vh] space-y-8">
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                                    Customer Details
                                </h3>
                                <div className="bg-gray-50 dark:bg-slate-950 p-5 rounded-[1.5rem] border border-gray-100 dark:border-slate-800 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xl shadow-sm">
                                        {(
                                            reviewLoan.userId?.firstName?.[0] ||
                                            "U"
                                        ).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-black text-gray-900 dark:text-white">
                                            {reviewLoan.userId?.firstName}{" "}
                                            {reviewLoan.userId?.lastName}
                                        </div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                            {reviewLoan.userId?.email}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                                    Loan Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-2xl p-4">
                                        <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase mb-1">
                                            Original Amount
                                        </div>
                                        <div className="font-black text-gray-900 dark:text-white text-lg">
                                            ₹
                                            {reviewLoan.principalAmount.toLocaleString(
                                                "en-IN",
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-2xl p-4">
                                        <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase mb-1">
                                            Monthly Payment
                                        </div>
                                        <div className="font-black text-blue-600 dark:text-blue-400 text-lg">
                                            ₹
                                            {reviewLoan.emiAmount.toLocaleString(
                                                "en-IN",
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-2xl p-4 text-center">
                                        <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase mb-1">
                                            Duration
                                        </div>
                                        <div className="font-bold text-gray-900 dark:text-white">
                                            {reviewLoan.tenureMonths} Months
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-2xl p-4 text-center">
                                        <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase mb-1">
                                            Annual Interest
                                        </div>
                                        <div className="font-bold text-gray-900 dark:text-white">
                                            {reviewLoan.interestRate}% p.a.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                                    Loan Information
                                </h3>
                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-[1.5rem] p-5">
                                    <div className="font-black text-blue-900 dark:text-blue-400 text-xs uppercase mb-3 tracking-wider">
                                        Category:{" "}
                                        {reviewLoan.loanReason ||
                                            reviewLoan.loanType}
                                    </div>
                                    <div className="text-sm text-blue-800 dark:text-blue-300/80 leading-relaxed font-medium italic">
                                        {reviewLoan.loanDescription
                                            ? `"${reviewLoan.loanDescription}"`
                                            : "No description metadata provided."}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    handleAction(reviewLoan._id, "Rejected")
                                }
                                className="flex-1 text-xs font-black uppercase h-12 rounded-2xl text-red-600 border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                Reject Application
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() =>
                                    handleAction(reviewLoan._id, "Approved")
                                }
                                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs h-12 rounded-2xl shadow-lg shadow-emerald-600/20"
                            >
                                Approve & Send Money
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
