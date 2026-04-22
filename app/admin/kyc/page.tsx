"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useAdminKYC } from "@/hooks/useAdminKYC";

export default function AdminKYCPage() {
    const {
        isLoading,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        docTypeFilter,
        setDocTypeFilter,
        reuploadFilter,
        setReuploadFilter,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedRecords,
        router,
    } = useAdminKYC();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-white dark:bg-slate-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
                            Identity Checks
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            List of identity documents waiting for a manual
                            check.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <input
                            type="text"
                            placeholder="Search name, email, customer ID..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48 transition-all"
                        />
                        <select
                            value={docTypeFilter}
                            onChange={(e) => {
                                setDocTypeFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="appearance-none bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2 pr-10 text-xs font-black uppercase text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                            {["All", "PAN", "Aadhar", "Signature"].map((v) => (
                                <option
                                    key={v}
                                    value={v}
                                    className="dark:bg-slate-900"
                                >
                                    {v === "All" ? "All Types" : v}
                                </option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="appearance-none bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2 pr-10 text-xs font-black uppercase text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                            {[
                                "All",
                                "Pending",
                                "In-Review",
                                "Verified",
                                "Rejected",
                            ].map((v) => (
                                <option
                                    key={v}
                                    value={v}
                                    className="dark:bg-slate-900"
                                >
                                    {v === "All" ? "All Statuses" : v}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                setReuploadFilter(!reuploadFilter);
                                setCurrentPage(1);
                            }}
                            className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl border transition-all ${reuploadFilter ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20" : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-400 hover:border-orange-500"}`}
                        >
                            Re-uploaded
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden transition-colors">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                                <tr>
                                    {[
                                        "Customer",
                                        "Submitted Documents",
                                        "Review State",
                                        "Timestamp",
                                        "Audit",
                                    ].map((h, i) => (
                                        <th
                                            key={h}
                                            className={`p-6 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ${i === 4 ? "text-right" : ""}`}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 transition-colors">
                                {paginatedRecords.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="p-20 text-center text-gray-300 dark:text-slate-700 font-black italic uppercase"
                                        >
                                            No records found matching filter
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRecords.map((group) => (
                                        <tr
                                            key={group.userId}
                                            className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 group transition-all"
                                        >
                                            <td className="p-6">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.push(
                                                            `/admin/kyc/${group.userId}`,
                                                        )
                                                    }
                                                    className="text-left group/name"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-base font-black text-gray-900 transition-colors group-hover/name:text-blue-600 dark:text-white dark:group-hover/name:text-blue-400">
                                                            {group.name}
                                                        </div>
                                                        {group.hasReuploaded && (
                                                            <span className="rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[9px] font-black uppercase text-orange-600 dark:border-orange-800/30 dark:bg-orange-900/20 dark:text-orange-400">
                                                                Re-uploaded
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 font-mono">
                                                        {group.email}
                                                    </div>
                                                    {group.customerId && (
                                                        <div className="mt-1 text-[10px] text-blue-600 dark:text-blue-400 font-mono tracking-[0.2em]">
                                                            {group.customerId}
                                                        </div>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {group.documents.map(
                                                        (doc) => (
                                                            <span
                                                                key={doc.id}
                                                                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-black uppercase text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                                                            >
                                                                {doc.type}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                                                    <span>
                                                        {group.stats.total}{" "}
                                                        total
                                                    </span>
                                                    <span>
                                                        {group.stats.pending}{" "}
                                                        pending
                                                    </span>
                                                    <span>
                                                        {group.stats.verified}{" "}
                                                        verified
                                                    </span>
                                                    <span>
                                                        {group.stats.rejected}{" "}
                                                        rejected
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border transition-all ${group.highestPriorityStatus === "Verified" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30" : group.highestPriorityStatus === "Rejected" ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/30" : group.highestPriorityStatus === "In-Review" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800/30" : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800/30"}`}
                                                >
                                                    {
                                                        group.highestPriorityStatus
                                                    }
                                                </span>
                                            </td>
                                            <td className="p-6 text-xs font-medium text-gray-500 dark:text-gray-400">
                                                {new Date(
                                                    group.latestActivityAt,
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="p-6 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.push(
                                                            `/admin/kyc/${group.userId}`,
                                                        )
                                                    }
                                                    className="text-[10px] font-black uppercase h-8 rounded-xl dark:border-slate-800 dark:text-white dark:hover:bg-slate-800 transition-all"
                                                >
                                                    Open Record
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/20 flex items-center justify-between">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.max(p - 1, 1),
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    className="rounded-xl font-black text-[10px] uppercase h-9 px-6 dark:border-slate-800 dark:text-gray-400"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(p + 1, totalPages),
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                    className="rounded-xl font-black text-[10px] uppercase h-9 px-6 dark:border-slate-800 dark:text-gray-400"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
