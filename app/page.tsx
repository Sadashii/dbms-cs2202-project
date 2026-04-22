"use client";

import React from "react";
import Link from "next/link";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import BranchGlobe from "@/components/BranchGlobe";

export default function LandingPage() {
    const { isLoggedIn, isLoading } = useAuthContext();

    return (
        <div className="flex-1 bg-white dark:bg-slate-950 transition-colors">
            {/* Hero Section */}
            <div className="relative isolate pt-14 dark:bg-slate-950">
                <div
                    className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                    aria-hidden="true"
                >
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#3b82f6] to-[#93c5fd] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
                </div>

                <div className="py-24 sm:py-32 lg:pb-40">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center animate-slide-in-from-bottom">
                            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                                Smart banking made simple
                            </h1>
                            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                                VaultPay helps you transfer money, monitor
                                expenses, and manage your finances with a fast,
                                secure, and intuitive banking experience.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                {!isLoading &&
                                    (isLoggedIn ? (
                                        <Link href="/my/overview">
                                            <Button
                                                size="lg"
                                                className="px-8 shadow-md"
                                            >
                                                Go to Dashboard
                                            </Button>
                                        </Link>
                                    ) : (
                                        <>
                                            <Link href="/auth/signup">
                                                <Button
                                                    size="lg"
                                                    className="px-8 shadow-md"
                                                >
                                                    Open an Account
                                                </Button>
                                            </Link>
                                            <Link
                                                href="/auth/login"
                                                className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            >
                                                Sign In{" "}
                                                <span aria-hidden="true">
                                                    →
                                                </span>
                                            </Link>
                                        </>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Globe Section */}
            <div className="relative isolate py-24 overflow-hidden bg-white dark:bg-slate-950 transition-colors border-t border-gray-100 dark:border-slate-900">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    <div className="mx-auto max-w-2xl mb-16 animate-fade-in">
                        <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                            Global Network
                        </h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                            Our presence, everywhere you go
                        </p>
                        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                            With physical branches and digital nodes across the
                            globe, VaultPay ensures you're connected to your
                            finances no matter where you are.
                        </p>
                    </div>
                    <BranchGlobe height="h-[500px] md:h-[750px]" />
                </div>
            </div>

            {/* Feature Grid Section */}
            <div className="bg-slate-50 dark:bg-slate-900 py-24 sm:py-32 border-t border-gray-100 dark:border-slate-800 transition-colors">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                            Everything you need
                        </h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                            Built for simple day-to-day banking.
                        </p>
                        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                            From checking your balance to sending money and
                            managing cards, VaultPay covers the basics a normal
                            banking website should have without trying to sound
                            like a finance startup pitch deck.
                        </p>
                    </div>

                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            {/* Feature 1 */}
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                                        <svg
                                            className="h-6 w-6 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
                                            />
                                        </svg>
                                    </div>
                                    Savings and Current Accounts
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">
                                    Open an account, check your balance anytime,
                                    and view your recent transactions in a clear
                                    and familiar layout.
                                </dd>
                            </div>

                            {/* Feature 2 */}
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                                        <svg
                                            className="h-6 w-6 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                                            />
                                        </svg>
                                    </div>
                                    Debit and Credit Cards
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">
                                    Manage your cards, review usage, and keep
                                    spending under control with simple card
                                    tools inside your account.
                                </dd>
                            </div>

                            {/* Feature 3 */}
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                                        <svg
                                            className="h-6 w-6 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                            />
                                        </svg>
                                    </div>
                                    Safe Login and Protection
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">
                                    Your account stays protected with secure
                                    login, password safety, and clear alerts for
                                    important account activity.
                                </dd>
                            </div>

                            {/* Feature 4 */}
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                                        <svg
                                            className="h-6 w-6 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                                            />
                                        </svg>
                                    </div>
                                    Fast Money Transfers
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">
                                    Send money between accounts, pay
                                    beneficiaries, and track transfer history
                                    without dealing with confusing finance
                                    jargon.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
