"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";

export default function AdminMetricsPage() {
    const router = useRouter();
    const { apiFetch, user } = useAuthContext();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiFetch("/api/admin/support/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.stats);
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchStats();
    }, [apiFetch]);

    if (user?.role !== "Admin") return null;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
                {}
                <button
                    onClick={() => router.push("/admin/support")}
                    className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-2 group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">
                        &larr;
                    </span>
                    Back to Ticket Protocol
                </button>

                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
                        Forensic Metrics
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Quantitative analysis of support center throughput and
                        uptime.
                    </p>
                </div>

                {stats ? (
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-2xl transition-all">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-8 border-b border-gray-50 dark:border-slate-800 pb-4">
                            Center Analytics Summary
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                                    Total Lifetime Volume
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black text-gray-900 dark:text-white">
                                        {stats.totalTickets}
                                    </p>
                                    <span className="text-xs font-bold text-gray-400 uppercase">
                                        Protocols
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                                    Active Operational Nodes
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black text-blue-600 dark:text-blue-400">
                                        {stats.openTickets}
                                    </p>
                                    <span className="text-xs font-bold text-blue-500/50 uppercase tracking-tighter italic">
                                        Pending Action
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                                    Communication Payload
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                                        {stats.totalMessages}
                                    </p>
                                    <span className="text-xs font-bold text-indigo-500/50 uppercase tracking-tighter italic">
                                        Packets
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                                    Mean Resolution Uptime
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                                        {stats.avgResolutionHours}
                                    </p>
                                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">
                                        Hours
                                    </span>
                                </div>
                            </div>
                        </div>

                        {}
                        <div className="mt-12 pt-8 border-t border-gray-50 dark:border-slate-800">
                            <div className="bg-gray-50 dark:bg-slate-950 p-4 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        System Status: Operational
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600">
                                    Sync: {new Date().toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            Compiling Analytics...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
