"use client";

import React from "react";
import { useAdminAudit } from "@/hooks/useAdminAudit";

export default function AuditLogsDashboard() {
    const {
        user,
        logs,
        pagination,
        isLoading,
        selectedLog,
        setSelectedLog,
        search,
        setSearch,
        severity,
        setSeverity,
        category,
        setCategory,
        status,
        setStatus,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        page,
        setPage,
        fetchLogs,
        resetFilters,
    } = useAdminAudit();

    const getSeverityColor = (s: string) => {
        switch (s) {
            case "Critical":
                return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50";
            case "High":
                return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50";
            case "Medium":
                return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50";
            default:
                return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50";
        }
    };

    const getStatusBadge = (s: string) => {
        switch (s) {
            case "Success":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "Failure":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            case "Blocked":
                return "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900";
            case "Flagged":
                return "bg-amber-100 text-amber-700 animate-pulse dark:bg-amber-900/30 dark:text-amber-400";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300";
        }
    };

    if (!user || !["Admin", "Manager"].includes(user.role)) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                            Activity History
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                            Live list of important actions on the system.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchLogs}
                            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
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
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="lg:col-span-2 relative">
                            <input
                                type="text"
                                placeholder="Search Reference, Resource, or Description..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <svg
                                className="w-4 h-4 text-slate-400 absolute left-4 top-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>

                        {[
                            {
                                val: severity,
                                set: setSeverity,
                                opt: [
                                    "All Severities",
                                    "Low",
                                    "Medium",
                                    "High",
                                    "Critical",
                                ],
                            },
                            {
                                val: category,
                                set: setCategory,
                                opt: [
                                    "All Categories",
                                    "Security",
                                    "Financial",
                                    "Operational",
                                    "Administrative",
                                ],
                            },
                            {
                                val: status,
                                set: setStatus,
                                opt: [
                                    "All Statuses",
                                    "Success",
                                    "Failure",
                                    "Flagged",
                                    "Blocked",
                                ],
                            },
                        ].map((sel, idx) => (
                            <select
                                key={idx}
                                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none cursor-pointer"
                                value={sel.val}
                                onChange={(e) => sel.set(e.target.value)}
                            >
                                {sel.opt.map((o) => (
                                    <option
                                        key={o}
                                        value={o.startsWith("All") ? "All" : o}
                                        className="dark:bg-slate-900"
                                    >
                                        {o}
                                    </option>
                                ))}
                            </select>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-50 dark:border-slate-800 pt-4 mt-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    From
                                </span>
                                <input
                                    type="date"
                                    className="bg-transparent text-xs font-bold dark:text-white outline-none invert dark:invert-0"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                />
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    To
                                </span>
                                <input
                                    type="date"
                                    className="bg-transparent text-xs font-bold dark:text-white outline-none invert dark:invert-0"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={resetFilters}
                                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest ml-2"
                            >
                                Reset
                            </button>
                        </div>
                        {pagination && (
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="p-2 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
                                >
                                    <svg
                                        className="w-4 h-4 dark:text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                </button>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 px-2">
                                    {page} / {pagination.totalPages}
                                </span>
                                <button
                                    disabled={page >= pagination.totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="p-2 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
                                >
                                    <svg
                                        className="w-4 h-4 dark:text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse min-w-[1000px]">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    {[
                                        "Time",
                                        "User Email / ID",
                                        "Action Type",
                                        "Category",
                                        "Level",
                                        "Status",
                                        "View",
                                    ].map((h, i) => (
                                        <th
                                            key={h}
                                            className={`px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ${i === 6 ? "text-right" : ""}`}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-20 text-center"
                                        >
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest italic"
                                        >
                                            No activity found
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr
                                            key={log._id}
                                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <td className="px-6 py-4">
                                                <p className="text-slate-900 dark:text-white font-bold">
                                                    {new Date(
                                                        log.createdAt,
                                                    ).toLocaleDateString()}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold">
                                                    {new Date(
                                                        log.createdAt,
                                                    ).toLocaleTimeString()}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-900 dark:text-white font-bold">
                                                    {log.userId?.email ||
                                                        "System"}
                                                </p>
                                                <span className="text-[9px] font-black uppercase text-slate-400">
                                                    {log.userRole}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-900 dark:text-white font-bold">
                                                    {log.actionType}
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[250px]">
                                                    {log.description}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                                    {log.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${getSeverityColor(log.severity)}`}
                                                >
                                                    {log.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${getStatusBadge(log.currentStatus)}`}
                                                >
                                                    {log.currentStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-block p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 group-hover:border-blue-200 dark:group-hover:border-blue-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all">
                                                    <svg
                                                        className="w-4 h-4 text-slate-300 group-hover:text-blue-500"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 5l7 7-7 7"
                                                        />
                                                    </svg>
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedLog && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setSelectedLog(null)}
                    />
                    <div className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-950 shadow-2xl flex flex-col animate-slide-left overflow-y-auto transition-colors border-l dark:border-slate-800">
                        <div className="sticky top-0 z-10 px-8 py-6 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-1 block">
                                    LOG REFERENCE
                                </span>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                    {selectedLog.logReference}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-2 border border-slate-100 dark:border-slate-800 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 dark:text-slate-500"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="p-8 space-y-10">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                                        IP Address
                                    </label>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">
                                        {selectedLog.metadata.ipAddress}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                                        Importance Level
                                    </label>
                                    <span
                                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase ${getSeverityColor(selectedLog.severity)}`}
                                    >
                                        {selectedLog.severity}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                                        User Agent Fingerprint
                                    </label>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                        {selectedLog.metadata.userAgent}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                                    Details
                                </label>
                                <p className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                                    {selectedLog.description}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                                    Data Changes
                                </label>
                                <div className="space-y-4">
                                    {selectedLog.payload.previousState && (
                                        <div className="space-y-1.5">
                                            <span className="text-[9px] font-black text-red-500 dark:text-red-400 uppercase tracking-widest">
                                                PREVIOUS STATE
                                            </span>
                                            <pre className="p-4 bg-slate-900 dark:bg-black rounded-2xl overflow-x-auto text-[11px] font-mono text-red-200">
                                                {JSON.stringify(
                                                    JSON.parse(
                                                        selectedLog.payload
                                                            .previousState,
                                                    ),
                                                    null,
                                                    2,
                                                )}
                                            </pre>
                                        </div>
                                    )}
                                    {selectedLog.payload.newState && (
                                        <div className="space-y-1.5">
                                            <span className="text-[9px] font-black text-green-500 dark:text-green-400 uppercase tracking-widest">
                                                NEW STATE
                                            </span>
                                            <pre className="p-4 bg-slate-900 dark:bg-black rounded-2xl overflow-x-auto text-[11px] font-mono text-green-200">
                                                {JSON.stringify(
                                                    JSON.parse(
                                                        selectedLog.payload
                                                            .newState,
                                                    ),
                                                    null,
                                                    2,
                                                )}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
