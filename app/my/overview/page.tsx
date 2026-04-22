"use client";

import React from "react";
import Link from "next/link";
import { TwoFactorModal } from "@/components/TwoFactorModal";
import { useOverview } from "@/hooks/useOverview";

const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`bg-gray-200 dark:bg-slate-800/50 rounded-xl animate-pulse ${className}`} />
);

function StatCard({ label, value, sub, icon, colorTheme, href }: { label: string; value: string; sub?: string; icon: React.ReactNode; colorTheme: 'blue' | 'amber' | 'red' | 'purple' | 'indigo'; href: string }) {
    const colors = {
        blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
        amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
        red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-500 dark:text-red-400' },
        purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
        indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' }
    };

    return (
        <Link href={href} className="block h-full">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-slate-800/50 transition-shadow p-5 flex gap-4 items-start h-full">
                <div className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${colors[colorTheme].bg}`}>
                    <div className={colors[colorTheme].text}>
                        {icon}
                    </div>
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
                    {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
                </div>
            </div>
        </Link>
    );
}

function TransactionItem({ tx, fmt }: { tx: any; fmt: any }) {
    const isCredit = tx.entryType === "Credit";
    const date = new Date(tx.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    return (
        <li className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-4 min-w-0">
                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${isCredit ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400"}`}>
                    {isCredit ? "↓" : "↑"}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {tx.memo || (tx.transactionId?.type === "TRANSFER" ? "Wallet Transfer" : "Transaction")}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center flex-wrap">
                        {date}
                        {tx.transactionId?.referenceId && (
                            <span className="ml-2 font-mono text-[10px] bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                                {tx.transactionId.referenceId}
                            </span>
                        )}
                    </p>
                </div>
            </div>
            <div className="text-right flex-shrink-0 pl-4">
                <p className={`text-sm font-bold ${isCredit ? "text-green-600 dark:text-green-400" : "text-gray-800 dark:text-gray-200"}`}>
                    {isCredit ? "+" : "−"}{fmt(tx.amount)}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Bal: {fmt(tx.balanceAfter)}</p>
            </div>
        </li>
    );
}

function AccountItem({ acc, fmt }: { acc: any; fmt: any }) {
    return (
        <li className="px-5 py-4">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {acc.accountType || "Savings"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    Active
                </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{fmt(acc.balance)}</p>
            <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-0.5">
                ****{acc.accountNumber.slice(-4)}
            </p>
        </li>
    );
}

function QuickAction({ label, icon, href }: { label: string; icon: string; href: string }) {
    return (
        <Link href={href} className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
            <span>{icon} {label}</span>
            <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
    );
}

export default function DashboardOverview() {
    const {
        user,
        data,
        isLoading,
        show2FAPrompt, setShow2FAPrompt,
        fmt,
        router,
        apiFetch
    } = useOverview();

    if (!user) return null;

    if (isLoading) {
        return (
            <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-6">
                <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-16 px-4 sm:px-6 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-40" /></div>
                        <Skeleton className="h-10 w-40 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
                        <div className="space-y-4"><Skeleton className="h-[250px] rounded-xl" /><Skeleton className="h-[200px] rounded-xl" /></div>
                    </div>
                </div>
            </main>
        );
    }

    const s = data?.summary;
    const currentDate = new Date().toLocaleDateString("en-GB", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-slate-50 dark:bg-slate-950 transition-colors h-full w-full">
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-16 px-4 sm:px-6 pt-4">
                <TwoFactorModal isOpen={show2FAPrompt} onClose={() => setShow2FAPrompt(false)} onSuccess={() => { setShow2FAPrompt(false); router.refresh(); }} apiFetch={apiFetch} />

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                            Welcome back, {user.firstName} 👋
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 transition-colors">
                            {currentDate}
                        </p>
                    </div>
                    <Link href="/my/beneficiaries" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm self-start sm:self-auto">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        Make a Transfer
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard
                        href="/my/accounts"
                        label="Net Worth"
                        value={fmt(s?.totalBalance || 0)}
                        sub={`Across ${s?.activeAccountsCount || 0} active accounts`}
                        colorTheme="blue"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <StatCard
                        href="/my/loans"
                        label="Loan Outstanding"
                        value={fmt(s?.totalLoanOutstanding || 0)}
                        sub={`${s?.activeLoansCount || 0} active loans`}
                        colorTheme="amber"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
                    />
                    <StatCard
                        href="/my/loans"
                        label="Next EMI Due"
                        value={s?.nextEmiDue ? fmt(s.nextEmiDue.amount) : "No Due"}
                        sub={s?.nextEmiDue ? new Date(s.nextEmiDue.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }) : "Zero liability"}
                        colorTheme="red"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    />
                    <StatCard
                        href="/my/cards"
                        label="Active Cards"
                        value={`${s?.activeCardsCount || 0}`}
                        sub="Debit & Credit"
                        colorTheme="purple"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content: Recent Activity */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
                            <Link href="/my/transactions" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                                View all &rarr;
                            </Link>
                        </div>
                        <ul className="divide-y divide-gray-50 dark:divide-slate-800/50">
                            {(data?.recentTransactions || []).length === 0 ? (
                                <li className="py-12 flex flex-col items-center justify-center text-center">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No Recent Entries Found</p>
                                </li>
                            ) : (
                                (data?.recentTransactions || []).slice(0, 10).map((tx) => (
                                    <TransactionItem key={tx._id} tx={tx} fmt={fmt} />
                                ))
                            )}
                        </ul>
                    </div>

                    {/* Sidebar: Accounts & Quick Actions */}
                    <div className="space-y-4">
                        {/* Your Accounts */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Your Accounts</h2>
                                <Link href="/my/accounts" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                                    Manage &rarr;
                                </Link>
                            </div>
                            <ul className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                {(data?.accounts || []).length === 0 ? (
                                    <li className="py-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                        No accounts found
                                    </li>
                                ) : (
                                    (data?.accounts || []).map((acc) => (
                                        <AccountItem key={acc._id} acc={acc} fmt={fmt} />
                                    ))
                                )}
                            </ul>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-5 space-y-2 transition-colors">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h2>
                            <QuickAction
                                label="New Transfer"
                                href="/my/beneficiaries"
                                icon="📨"
                            />
                            <QuickAction
                                label="Manage Cards"
                                href="/my/cards"
                                icon="💳"
                            />
                            <QuickAction
                                label="Loan Calculator"
                                href="/my/loans"
                                icon="🏦"
                            />
                            <QuickAction
                                label="Support Center"
                                href="/my/support"
                                icon="🎧"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}