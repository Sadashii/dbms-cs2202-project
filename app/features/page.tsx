"use client";

import React from "react";
import { Navbar } from "@/components/Navbar"; // Assuming you need this since it was imported
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Extracted feature data for cleaner JSX
const featuresData = [
    {
        title: "Smart Accounts",
        description: "Open high-yield savings or flexible checking accounts in minutes. Track your expenses automatically and grow your money effortlessly with auto-transfers.",
        gradient: "from-blue-500 to-indigo-600",
        icon: (
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
    },
    {
        title: "Instant Loans",
        description: "Need cash fast? Get personalized loan offers with transparent EMI calculations. Apply directly from your dashboard and get approved in hours, not days.",
        gradient: "from-emerald-400 to-teal-600",
        icon: (
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        title: "Virtual Cards",
        description: "Generate one-time use virtual credit or debit cards for secure online shopping. Easily manage limits, freeze cards, and protect your physical card details.",
        gradient: "from-purple-500 to-rose-500",
        icon: (
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        title: "Bank-grade Security",
        description: "Rest easy knowing your funds are protected by end-to-end encryption, multi-factor authentication, and robust audit trails across all actions.",
        gradient: "from-orange-400 to-red-500",
        icon: (
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
    },
];

export default function FeaturesPage() {
    return (
        <div className="bg-slate-50 relative font-sans">
            {/* Background Decorators */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-950 via-indigo-900 to-slate-50 z-0 opacity-95"></div>
            <div className="absolute top-0 right-0 w-1/2 h-96 bg-blue-400 rounded-full blur-[150px] opacity-30 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-1/2 h-96 bg-indigo-500 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

            {/* Hero Section */}
            <div className="relative z-10 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8 drop-shadow-sm">
                        Everything you need to{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-blue-400">
                            manage your wealth
                        </span>
                    </h1>
                    <p className="text-lg md:text-2xl text-blue-100/90 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
                        VaultPay brings together your checking, savings, credit, and loans into one powerful, unified experience. Discover the features that make us the best choice for your finances.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/auth/signup">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto bg-white text-blue-900 hover:bg-gray-50 font-bold border-none shadow-2xl shadow-blue-900/20 transform transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 h-14 px-8 text-lg rounded-full"
                            >
                                Open an Account Today
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Render Standard Features */}
                    {featuresData.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-white/80 backdrop-blur-2xl border border-white/60 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200/40 hover:ring-2 hover:ring-blue-500/10 transition-all duration-300 transform hover:-translate-y-2 group"
                        >
                            <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
                                {feature.title}
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-base">
                                {feature.description}
                            </p>
                        </div>
                    ))}

                    {/* Featured Wide Card (Automated Transfers) */}
                    <div className="bg-white/80 backdrop-blur-2xl border border-white/60 p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-gray-200/50 hover:ring-2 hover:ring-gray-900/5 transition-all duration-300 transform hover:-translate-y-2 group lg:col-span-2">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-10">
                            <div className="flex-1">
                                <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-black rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight text-left">
                                    Automated Transfers
                                </h3>
                                <p className="text-slate-600 leading-relaxed text-left text-lg">
                                    Put your finances on autopilot. Schedule recurring daily, weekly, or monthly transfers to beneficiaries. Ensure bills are paid on time, and savings happen automatically without you lifting a finger.
                                </p>
                            </div>

                            {/* Interactive/Mock UI side */}
                            <div className="flex-1 bg-slate-50/50 border border-slate-100 p-6 md:p-8 rounded-3xl shadow-inner relative overflow-hidden w-full">
                                <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow mb-4 flex items-center justify-between border border-slate-100/80">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                            R
                                        </div>
                                        <div>
                                            <div className="h-3 w-24 bg-slate-200 rounded-full mb-2"></div>
                                            <div className="h-2 w-16 bg-slate-100 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-base font-bold text-slate-800">₹45,000</div>
                                        <div className="text-xs font-medium text-slate-400 mt-1">Monthly</div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between border border-slate-100/80">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                            M
                                        </div>
                                        <div>
                                            <div className="h-3 w-20 bg-slate-200 rounded-full mb-2"></div>
                                            <div className="h-2 w-24 bg-slate-100 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-base font-bold text-slate-800">₹10,000</div>
                                        <div className="text-xs font-medium text-slate-400 mt-1">Weekly</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="relative mt-16 border-t border-slate-200/60 bg-gradient-to-b from-white to-slate-50">
                <div className="max-w-4xl mx-auto py-24 px-6 lg:px-8 text-center flex flex-col items-center">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                        Ready to take control?
                    </h2>
                    <p className="text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
                        Join millions of users who are already building their financial future with VaultPay. Sign up takes less than 3 minutes.
                    </p>
                    <Link href="/auth/signup">
                        <Button
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 px-10 h-16 rounded-full text-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95"
                        >
                            Open Your Free Account
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}