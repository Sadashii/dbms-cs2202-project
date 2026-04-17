"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            <Navbar />
            
            {/* Background elements */}
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-50 z-0 opacity-90"></div>
            <div className="absolute top-0 right-0 w-1/2 h-96 bg-blue-500 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-1/2 h-96 bg-indigo-500 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

            <div className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 drop-shadow-sm">
                        Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">manage your wealth</span>
                    </h1>
                    <p className="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed">
                        VaultPay brings together your checking, savings, credit, and loans into one powerful, unified experience. Discover the features that make us the best choice for your finances.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/auth/signup">
                            <Button size="lg" className="w-full sm:w-auto bg-white text-blue-900 hover:bg-gray-10 font-bold border-none shadow-xl transform transition hover:scale-105 active:scale-95">Open an Account Today</Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Feature 1 */}
                    <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Accounts</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Open high-yield savings or flexible checking accounts in minutes. Track your expenses automatically and grow your money effortlessly with auto-transfers.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Instant Loans</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Need cash fast? Get personalized loan offers with transparent EMI calculations. Apply directly from your dashboard and get approved in hours, not days.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Virtual Cards</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Generate one-time use virtual credit or debit cards for secure online shopping. Easily manage limits, freeze cards, and protect your physical card details.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Bank-grade Security</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Rest easy knowing your funds are protected by end-to-end encryption, multi-factor authentication, and robust audit trails across all actions.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group md:col-span-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-8">
                            <div className="flex-1">
                                <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-black rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3 text-left">Automated Transfers </h3>
                                <p className="text-gray-600 leading-relaxed text-left">
                                    Put your finances on autopilot. Schedule recurring daily, weekly, or monthly transfers to beneficiaries. Ensure bills are paid on time, and savings happen automatically without you lifting a finger.
                                </p>
                            </div>
                            <div className="flex-1 bg-gray-50 border border-gray-100 p-6 rounded-2xl shadow-inner relative overflow-hidden">
                                 {/* Abstract UI representation */}
                                 <div className="bg-white rounded-lg p-3 shadow-sm mb-3 flex items-center justify-between border border-gray-100">
                                     <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">R</div>
                                         <div>
                                            <div className="h-2.5 w-20 bg-gray-200 rounded mb-1"></div>
                                            <div className="h-1.5 w-12 bg-gray-100 rounded"></div>
                                         </div>
                                     </div>
                                     <div className="text-right">
                                         <div className="text-sm font-bold text-gray-800">₹45,000</div>
                                         <div className="text-[9px] text-gray-400">Monthly</div>
                                     </div>
                                 </div>
                                 <div className="bg-white rounded-lg p-3 shadow-sm flex items-center justify-between border border-gray-100">
                                     <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">M</div>
                                         <div>
                                            <div className="h-2.5 w-16 bg-gray-200 rounded mb-1"></div>
                                            <div className="h-1.5 w-24 bg-gray-100 rounded"></div>
                                         </div>
                                     </div>
                                     <div className="text-right">
                                         <div className="text-sm font-bold text-gray-800">₹10,000</div>
                                         <div className="text-[9px] text-gray-400">Weekly</div>
                                     </div>
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

             {/* CTA Section */}
            <div className="relative bg-white mt-10 border-t border-gray-200">
                <div className="max-w-7xl mx-auto py-20 px-6 lg:px-8 text-center flex flex-col items-center">
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Ready to take control?</h2>
                    <p className="text-lg text-slate-600 mb-8 max-w-2xl">
                        Join millions of users who are already building their financial future with VaultPay. 
                        Sign up takes less than 3 minutes.
                    </p>
                    <Link href="/auth/signup">
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl px-8 py-6 rounded-full text-lg font-bold transition-all hover:scale-105 active:scale-95">Open Free Account</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
