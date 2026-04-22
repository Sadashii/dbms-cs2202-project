"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useAccountDetail } from "@/hooks/useAccountDetail";

export default function AccountHistoryPage() {
    const {
        account,
        isLoading,
        authLoading,
        searchQuery, setSearchQuery,
        entryTypeFilter, setEntryTypeFilter,
        startDate, setStartDate,
        endDate, setEndDate,
        page, setPage,
        totalPages,
        total,
        displayedEntries,
        symbol,
        router
    } = useAccountDetail();

    if (isLoading && !account) {
        return (
            <div className="max-w-7xl mx-auto py-20 flex justify-center animate-fade-in">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
            </div>
        );
    }

    if (!account) {
        return (
            <div className="max-w-7xl mx-auto py-20 text-center animate-fade-in">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Account Not Found</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">We couldn&apos;t load the details for this account.</p>
                <Button onClick={() => router.push("/my/accounts")} variant="primary">Return to Accounts</Button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12 px-4 sm:px-6 transition-colors">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4 pt-2">
                <div>
                    <button onClick={() => router.push("/my/accounts")} className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-2 transition-colors">← Back to Accounts</button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{account.accountType} (****{account.accountNumber.slice(-4)})</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current Balance</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{symbol}{account.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex-1"><input type="text" placeholder="Search memo, type, or Ref ID…" className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                <div className="flex flex-wrap gap-2">
                    <input type="date" className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 color-scheme-light dark:[color-scheme:dark] transition-colors" value={startDate} onChange={(e) => setStartDate(e.target.value)} title="From" />
                    <input type="date" className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 color-scheme-light dark:[color-scheme:dark] transition-colors" value={endDate} onChange={(e) => setEndDate(e.target.value)} title="To" />
                    <select className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={entryTypeFilter} onChange={(e) => setEntryTypeFilter(e.target.value)}>
                        <option value="All">All Types</option>
                        <option value="Credit">Credits (+)</option>
                        <option value="Debit">Debits (−)</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                {isLoading ? (
                    <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" /></div>
                ) : displayedEntries.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="mx-auto w-14 h-14 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 transition-colors"><svg className="w-7 h-7 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No transactions found</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters or make your first transfer.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 transition-colors">
                                <tr>{["Date", "Details", "Type", "Amount", "Balance After"].map((h) => (<th key={h} className={`px-5 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide ${h === "Amount" || h === "Balance After" ? "text-right" : ""}`}>{h}</th>))}</tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                {displayedEntries.map((entry) => (
                                    <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <p className="text-gray-900 dark:text-gray-100 font-medium text-sm">{new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                                            <p className="text-gray-400 dark:text-gray-500 text-xs">{new Date(entry.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                                        </td>
                                        <td className="px-5 py-4 min-w-[200px]">
                                            <p className="text-gray-900 dark:text-gray-100 font-medium">{entry.memo || (entry.entryType === "Credit" ? "Deposit" : "Withdrawal")}</p>
                                            {entry.transactionId?.referenceId && <span className="text-gray-400 dark:text-gray-500 font-mono text-[11px] border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded mt-1 inline-block transition-colors">{entry.transactionId.referenceId}</span>}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${entry.entryType === "Credit" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"}`}>{entry.transactionId?.type || entry.entryType}</span></td>
                                        <td className="px-5 py-4 text-right whitespace-nowrap"><p className={`font-semibold ${entry.entryType === "Credit" ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-gray-100"}`}>{entry.entryType === "Credit" ? "+" : "−"}{symbol}{entry.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></td>
                                        <td className="px-5 py-4 text-right whitespace-nowrap"><p className="text-gray-500 dark:text-gray-400 font-medium text-sm">{symbol}{entry.balanceAfter.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && total > 0 && (
                    <div className="bg-gray-50 dark:bg-slate-800/50 px-5 py-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between transition-colors">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages} &nbsp;·&nbsp; {total} total entr{total !== 1 ? "ies" : "y"}</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="py-1 h-auto text-xs border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">Previous</Button>
                            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="py-1 h-auto text-xs border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">Next</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
