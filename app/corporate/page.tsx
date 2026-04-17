"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CorporatePage() {
    return (
        <div className="min-h-screen bg-[#0A0F1C] text-white relative overflow-hidden font-sans">
            <div className="opacity-90">
               <Navbar />
            </div>
            
            {/* Dark premium background effects */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-900 rounded-full blur-[200px] opacity-20 pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900 rounded-full blur-[150px] opacity-20 pointer-events-none translate-y-1/3 -translate-x-1/4"></div>

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 border-b border-white/10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="animate-fade-in-up">
                            <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-bold uppercase tracking-widest mb-8">
                                VaultPay For Business
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6">
                                Powering the <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                                    next generation
                                </span> <br/>
                                of enterprise.
                            </h1>
                            <p className="text-lg text-slate-400 mb-10 max-w-lg leading-relaxed">
                                Seamless API integration, bulk transaction processing, and elite corporate treasury management designed for unparalleled scale and security.
                            </p>
                            <div className="flex gap-4">
                                <Link href="/auth/signup">
                                    <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white border-none shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all hover:scale-105 rounded-full px-8">
                                        Open Corporate Account
                                    </Button>
                                </Link>
                                <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full px-8 bg-transparent">
                                    Contact Sales
                                </Button>
                            </div>
                        </div>

                        {/* Abstract Hero Image/Graphic */}
                        <div className="relative lg:h-[600px] flex items-center justify-center animate-fade-in">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-3xl backdrop-blur-3xl border border-white/5 transform rotate-3 scale-105"></div>
                            <div className="relative w-full max-w-md bg-[#131B2F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                                        <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Treasury Overview</span>
                                    </div>
                                    <span className="text-xs font-mono text-slate-500">Live API</span>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Global Balance</p>
                                        <p className="text-4xl font-light font-mono text-white">$142,504,890.00</p>
                                    </div>
                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Processed Today</span>
                                        <span className="text-emerald-400 font-mono">+ 14.5M</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Active API Keys</span>
                                        <span className="text-white font-mono">14 / 20</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Fraud Prevention</span>
                                        <span className="text-blue-400 font-mono">Active (AI-Shield)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    <div className="mb-16 text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4">Enterprise-grade capabilities out of the box.</h2>
                        <p className="text-slate-400">Everything you need to automate your company's finances reliably.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-[#131B2F] border border-white/5 rounded-2xl p-8 hover:bg-[#1A243F] transition-colors">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-6">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">REST API & Webhooks</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Automate payouts, query balances, and receive instant notifications for ledger updates in your own systems.</p>
                        </div>
                        <div className="bg-[#131B2F] border border-white/5 rounded-2xl p-8 hover:bg-[#1A243F] transition-colors">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-6">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Role-Based Access</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Delegate access to your accounting team. Set dual-approval workflows for large outgoing transactions.</p>
                        </div>
                        <div className="bg-[#131B2F] border border-white/5 rounded-2xl p-8 hover:bg-[#1A243F] transition-colors">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Bulk Payroll Processing</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Upload CSVs or use the API to process thousands of salary deposits instantly with minimal failure rates.</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
