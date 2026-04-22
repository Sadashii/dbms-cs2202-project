"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardData {
    summary: {
        totalBalance: number;
        activeAccountsCount: number;
        totalLoanOutstanding: number;
        activeLoansCount: number;
        activeCardsCount: number;
        nextEmiDue: { amount: number; date: string; type: string } | null;
    };
    accounts: Array<{
        _id: string;
        accountNumber: string;
        accountType: string;
        balance: number;
        currency: string;
        currentStatus: string;
    }>;
    recentTransactions: Array<{
        _id: string;
        entryType: "Credit" | "Debit";
        amount: number;
        balanceAfter: number;
        memo?: string;
        createdAt: string;
        transactionId?: { referenceId?: string; type?: string };
    }>;
}

const Skeleton = ({ className = "" }: { className?: string }) => (
    <div
        className={`bg-gray-200 dark:bg-slate-800 rounded animate-pulse ${className}`}
    />
);

// ─── Onboarding Empty State ───────────────────────────────────────────────────
function OnboardingBanner({ firstName }: { firstName: string }) {
    return (
        <div className="rounded-2xl overflow-hidden border border-blue-100 dark:border-slate-800 bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 shadow-sm transition-colors">
            <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                {}
                <div className="flex-shrink-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center shadow-inner">
                    <svg
                        className="w-16 h-16 text-blue-500 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                    </svg>
                </div>

                <div className="text-center md:text-left flex-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">
                        Welcome aboard
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Hi {firstName}, let&apos;s get started!
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-lg mb-6">
                        Your VaultPay account is set up. To begin banking,
                        submit your KYC documents and apply for your first
                        account — it only takes a few minutes.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                        <Link
                            href="/my/accounts"
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Open Your First Account
                        </Link>
                        <Link
                            href="/my/support"
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <svg
                                className="w-4 h-4 text-gray-400 dark:text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                            </svg>
                            Contact Support
                        </Link>
                    </div>
                </div>

                {}
                <div className="hidden lg:flex flex-col gap-4 w-60 flex-shrink-0">
                    {[
                        { step: 1, label: "Create your account", done: true },
                        { step: 2, label: "Submit KYC documents", done: false },
                        {
                            step: 3,
                            label: "Get approved & start banking",
                            done: false,
                        },
                    ].map(({ step, label, done }) => (
                        <div key={step} className="flex items-center gap-3">
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? "bg-green-500 text-white" : "bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-gray-500"}`}
                            >
                                {done ? "✓" : step}
                            </div>
                            <span
                                className={`text-sm font-medium ${done ? "text-green-700 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}
                            >
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    sub,
    icon,
    color,
    href,
}: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ReactNode;
    color: string;
    href?: string;
}) {
    const inner = (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-slate-800/50 transition-shadow p-5 flex gap-4 items-start h-full">
            <div
                className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${color}`}
            >
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {label}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white truncate">
                    {value}
                </p>
                {sub && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
    return href ? (
        <Link href={href} className="block h-full">
            {inner}
        </Link>
    ) : (
        inner
    );
}

export default function DashboardOverview() {
    const {
        user,
        apiFetch,
        isLoading: authLoading,
        isLoggedIn,
    } = useAuthContext();
    const router = useRouter();

    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) router.push("/auth/login");
    }, [authLoading, isLoggedIn, router]);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const res = await apiFetch("/api/dashboard");
                if (res.ok) setData(await res.json());
            } catch (e) {
                console.error("Dashboard fetch failed", e);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [user, apiFetch]);

    if (!user) return null;

    const isNewUser =
        !isLoading && (!data?.accounts || data.accounts.length === 0);
    const s = data?.summary;
    const fmt = (n: number, cur = "INR") =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: cur,
            maximumFractionDigits: 0,
        }).format(n);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-52" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-9 w-32 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-72 rounded-xl lg:col-span-2" />
                    <Skeleton className="h-72 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-16 px-4 sm:px-6 pt-4">
            {}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                        Welcome back, {user.firstName} 👋
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 transition-colors">
                        {new Date().toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </p>
                </div>
                {!isNewUser && (
                    <Link
                        href="/my/accounts"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm self-start sm:self-auto"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                            />
                        </svg>
                        Make a Transfer
                    </Link>
                )}
            </div>

            {}
            {isNewUser && <OnboardingBanner firstName={user.firstName} />}

            {}
            {!isNewUser && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard
                        label="Net Worth"
                        value={fmt(s?.totalBalance ?? 0)}
                        sub={`Across ${s?.activeAccountsCount ?? 0} active account${(s?.activeAccountsCount ?? 0) !== 1 ? "s" : ""}`}
                        href="/my/accounts"
                        color="bg-blue-100 dark:bg-blue-900/30"
                        icon={
                            <svg
                                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Loan Outstanding"
                        value={
                            s?.activeLoansCount
                                ? fmt(s.totalLoanOutstanding)
                                : "No loans"
                        }
                        sub={
                            s?.activeLoansCount
                                ? `${s.activeLoansCount} active loan${s.activeLoansCount !== 1 ? "s" : ""}`
                                : "Apply for a loan →"
                        }
                        href="/my/loans"
                        color="bg-amber-100 dark:bg-amber-900/30"
                        icon={
                            <svg
                                className="w-5 h-5 text-amber-600 dark:text-amber-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                                />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Next EMI Due"
                        value={s?.nextEmiDue ? fmt(s.nextEmiDue.amount) : "—"}
                        sub={
                            s?.nextEmiDue
                                ? new Date(
                                      s.nextEmiDue.date,
                                  ).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                  })
                                : "No upcoming EMIs"
                        }
                        href="/my/loans"
                        color="bg-red-100 dark:bg-red-900/30"
                        icon={
                            <svg
                                className="w-5 h-5 text-red-500 dark:text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Active Cards"
                        value={String(s?.activeCardsCount ?? 0)}
                        sub="Debit & Credit"
                        href="/my/cards"
                        color="bg-purple-100 dark:bg-purple-900/30"
                        icon={
                            <svg
                                className="w-5 h-5 text-purple-600 dark:text-purple-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                />
                            </svg>
                        }
                    />
                </div>
            )}

            {}
            {!isNewUser && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Recent Activity
                            </h2>
                            <Link
                                href="/my/accounts"
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                            >
                                View all →
                            </Link>
                        </div>

                        {!data?.recentTransactions ||
                        data.recentTransactions.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                                <svg
                                    className="mx-auto mb-3 w-10 h-10 text-gray-300 dark:text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                                <p className="text-sm font-medium">
                                    No transactions yet
                                </p>
                                <p className="text-xs mt-1">
                                    Your recent activity will appear here.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                {data.recentTransactions.map((txn) => (
                                    <li
                                        key={txn._id}
                                        className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div
                                                className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${txn.entryType === "Credit" ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400"}`}
                                            >
                                                {txn.entryType === "Credit"
                                                    ? "↓"
                                                    : "↑"}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {txn.memo ||
                                                        (txn.entryType ===
                                                        "Credit"
                                                            ? "Deposit"
                                                            : "Withdrawal")}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                    {new Date(
                                                        txn.createdAt,
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        },
                                                    )}
                                                    {txn.transactionId
                                                        ?.referenceId && (
                                                        <span className="ml-2 font-mono text-[10px] bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                                                            {
                                                                txn
                                                                    .transactionId
                                                                    .referenceId
                                                            }
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 pl-4">
                                            <p
                                                className={`text-sm font-bold ${txn.entryType === "Credit" ? "text-green-600 dark:text-green-400" : "text-gray-800 dark:text-gray-200"}`}
                                            >
                                                {txn.entryType === "Credit"
                                                    ? "+"
                                                    : "−"}
                                                ₹
                                                {txn.amount.toLocaleString(
                                                    "en-IN",
                                                    {
                                                        minimumFractionDigits: 2,
                                                    },
                                                )}
                                            </p>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                                Bal: ₹
                                                {txn.balanceAfter.toLocaleString(
                                                    "en-IN",
                                                    {
                                                        minimumFractionDigits: 0,
                                                    },
                                                )}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {}
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                    Your Accounts
                                </h2>
                                <Link
                                    href="/my/accounts"
                                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                >
                                    Manage →
                                </Link>
                            </div>
                            <ul className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                {data?.accounts.map((acc) => (
                                    <li key={acc._id} className="px-5 py-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                {acc.accountType}
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${acc.currentStatus === "Active" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400"}`}
                                            >
                                                {acc.currentStatus}
                                            </span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            ₹
                                            {acc.balance.toLocaleString(
                                                "en-IN",
                                                {
                                                    minimumFractionDigits: 2,
                                                },
                                            )}
                                        </p>
                                        <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-0.5">
                                            ****{acc.accountNumber.slice(-4)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-5 space-y-2 transition-colors">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Quick Actions
                            </h2>
                            {[
                                {
                                    label: "📨 New Transfer",
                                    href: "/my/accounts",
                                },
                                { label: "💳 Manage Cards", href: "/my/cards" },
                                {
                                    label: "🏦 Loan Calculator",
                                    href: "/my/loans",
                                },
                                {
                                    label: "🎧 Support Center",
                                    href: "/my/support",
                                },
                            ].map(({ label, href }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                                >
                                    <span>{label}</span>
                                    <svg
                                        className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors"
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
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
