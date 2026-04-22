"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

interface Ticket {
    _id: string;
    ticketId: string;
    subject: string;
    category: string;
    priority: string;
    currentStatus: string;
    lastMessageAt: string;
    userId: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

interface Stats {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    totalMessages: number;
    avgResolutionHours: string;
}

export default function AdminSupportPage() {
    const router = useRouter();
    const { apiFetch, user } = useAuthContext();

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const statsRes = await apiFetch("/api/admin/support/stats");
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
            }

            const ticketsRes = await apiFetch(
                `/api/admin/support?status=${statusFilter}`,
            );
            if (ticketsRes.ok) {
                const data = await ticketsRes.json();
                setTickets(data.tickets);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [statusFilter]);

    const filteredTickets = tickets.filter(
        (ticket) =>
            ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ticket.userId &&
                `${ticket.userId.firstName} ${ticket.userId.lastName}`
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())),
    );

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "Open":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50";
            case "In-Progress":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50";
            case "Re-Opened":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/50";
            case "Resolved":
            case "Closed":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-gray-400 border-gray-200 dark:border-slate-700";
        }
    };

    const getPriorityBadgeColor = (priority: string) => {
        switch (priority) {
            case "Low":
                return "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-gray-400";
            case "Medium":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
            case "High":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
            case "Urgent":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-gray-400";
        }
    };

    if (user?.role !== "Admin") {
        return (
            <div className="p-8 text-center text-red-600 font-black uppercase tracking-widest">
                Unauthorized Access Restricted
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 p-4 md:p-8 space-y-8">
            {}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
                        Support Terminal
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Manage and resolve customer uplink requests.
                    </p>
                </div>
                <Button
                    onClick={() => router.push("/admin/support/metrics")}
                    variant="outline"
                    className="dark:border-slate-800 dark:text-white rounded-xl"
                >
                    View Forensic Metrics
                </Button>
            </div>

            {}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
                    {[
                        {
                            label: "Total Volume",
                            value: stats.totalTickets,
                            color: "text-gray-900 dark:text-white",
                        },
                        {
                            label: "Active Dues",
                            value: stats.openTickets,
                            color: "text-blue-600 dark:text-blue-400",
                        },
                        {
                            label: "Resolved",
                            value: stats.resolvedTickets,
                            color: "text-emerald-600 dark:text-emerald-400",
                        },
                        {
                            label: "Avg Uptime",
                            value: `${stats.avgResolutionHours}h`,
                            color: "text-gray-900 dark:text-white",
                        },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-all"
                        >
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                {stat.label}
                            </p>
                            <p
                                className={`text-2xl font-black mt-1 ${stat.color}`}
                            >
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {}
            <div className="bg-white dark:bg-slate-900 shadow-2xl rounded-[2rem] border border-gray-100 dark:border-slate-800 overflow-hidden max-w-7xl mx-auto transition-colors">
                {}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search Subject, ID or Customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-10 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <svg
                            className="w-4 h-4 text-gray-400 absolute left-4 top-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer font-bold transition-all"
                        >
                            <option value="All" className="dark:bg-slate-900">
                                All Protocols
                            </option>
                            <option value="Open" className="dark:bg-slate-900">
                                Open
                            </option>
                            <option
                                value="In-Progress"
                                className="dark:bg-slate-900"
                            >
                                In-Progress
                            </option>
                            <option
                                value="Re-Opened"
                                className="dark:bg-slate-900"
                            >
                                Re-Opened
                            </option>
                            <option
                                value="Resolved"
                                className="dark:bg-slate-900"
                            >
                                Resolved
                            </option>
                            <option
                                value="Closed"
                                className="dark:bg-slate-900"
                            >
                                Closed
                            </option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                            <svg
                                className="h-4 w-4 fill-current"
                                viewBox="0 0 20 20"
                            >
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-slate-800/50 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800">
                                <th className="px-6 py-4">Ticket Protocol</th>
                                <th className="px-6 py-4">Origin Principal</th>
                                <th className="px-6 py-4">Urgency</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Last Sync</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800 transition-colors">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-20 text-center"
                                    >
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredTickets.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-20 text-center text-gray-400 font-bold uppercase italic tracking-widest"
                                    >
                                        Clear: No matching uplink requests
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <tr
                                        key={ticket._id}
                                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 cursor-pointer group transition-all"
                                        onClick={() =>
                                            router.push(
                                                `/admin/support/${ticket.ticketId}`,
                                            )
                                        }
                                    >
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                {ticket.subject}
                                            </div>
                                            <div className="text-[10px] font-mono text-gray-400 dark:text-gray-500 uppercase">
                                                {ticket.ticketId} &bull;{" "}
                                                {ticket.category}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {ticket.userId ? (
                                                <>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-gray-300">
                                                        {
                                                            ticket.userId
                                                                .firstName
                                                        }{" "}
                                                        {ticket.userId.lastName}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                                        {ticket.userId.email}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-sm text-gray-400 italic">
                                                    Unidentified Source
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border ${getPriorityBadgeColor(ticket.priority)}`}
                                            >
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border ${getStatusBadgeColor(ticket.currentStatus)}`}
                                            >
                                                {ticket.currentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {new Date(
                                                ticket.lastMessageAt,
                                            ).toLocaleDateString()}{" "}
                                            &bull;{" "}
                                            {new Date(
                                                ticket.lastMessageAt,
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
