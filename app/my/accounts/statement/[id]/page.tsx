"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function StatementPage() {
    const {
        apiFetch,
        user,
        isLoading: authLoading,
        isLoggedIn,
    } = useAuthContext();
    const params = useParams();
    const router = useRouter();

    const [account, setAccount] = useState<any>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFullHistory = useCallback(async () => {
        if (!params.id) return;
        setIsLoading(true);
        try {
            const res = await apiFetch(
                `/api/accounts/${params.id}/transactions?limit=100`,
            );
            if (res.ok) {
                const data = await res.json();
                setAccount(data.account);
                setEntries(data.transactions);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [apiFetch, params.id]);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) router.push("/auth/login");
        if (isLoggedIn) fetchFullHistory();
    }, [authLoading, isLoggedIn, router, fetchFullHistory]);

    const handlePrint = () => {
        window.print();
    };

    if (isLoading || !account) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 print:bg-white pb-20 transition-colors">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }

    const symbol = account.currency === "INR" ? "₹" : "$";
    const totalCredits = entries
        .filter((e) => e.entryType === "Credit")
        .reduce((acc, curr) => acc + curr.amount, 0);
    const totalDebits = entries
        .filter((e) => e.entryType === "Debit")
        .reduce((acc, curr) => acc + curr.amount, 0);
    const openingBalance =
        entries.length > 0
            ? entries[entries.length - 1].balanceAfter -
              (entries[entries.length - 1].entryType === "Credit"
                  ? entries[entries.length - 1].amount
                  : -entries[entries.length - 1].amount)
            : account.balance;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-950 py-10 px-4 sm:px-6 print:bg-white print:py-0 print:px-0 transition-colors">
            <style jsx global>{`
                @media print {
                    body {
                        background-color: white !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-container {
                        box-shadow: none !important;
                        border: none !important;
                        max-width: 100% !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 20px !important;
                        background-color: white !important;
                        color: black !important;
                    }
                    .print-text-dark {
                        color: #111827 !important;
                    }
                    .print-text-gray {
                        color: #6b7280 !important;
                    }
                    .print-border-light {
                        border-color: #f3f4f6 !important;
                    }
                    @page {
                        margin: 1cm;
                    }
                }
            `}</style>

            <div className="max-w-4xl mx-auto no-print mb-6 flex justify-between items-center">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="text-gray-600 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                >
                    ← Back
                </Button>
                <Button
                    variant="primary"
                    onClick={handlePrint}
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                >
                    Download as PDF / Print
                </Button>
            </div>

            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 shadow-2xl dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden print-container font-sans text-gray-900 dark:text-gray-100 transition-colors">
                {}
                <div className="p-8 border-b-2 border-blue-600 flex justify-between items-start bg-gray-50 dark:bg-slate-900/50 print:bg-gray-50 transition-colors">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-inner">
                                V
                            </div>
                            <h1 className="text-2xl font-black tracking-tighter text-blue-900 dark:text-blue-100 print-text-dark">
                                VAULTPAY{" "}
                                <span className="font-light text-blue-500 dark:text-blue-400">
                                    DIGITAL
                                </span>
                            </h1>
                        </div>
                        <div className="text-sm space-y-0.5 text-gray-600 dark:text-gray-400 print-text-gray">
                            <p className="font-bold text-gray-800 dark:text-gray-200 print-text-dark">
                                VAULTPAY BANKING CORP.
                            </p>
                            <p>Financial District, Gachibowli</p>
                            <p>Hyderabad, TS 500032</p>
                            <p>Contact: support@vaultpay.digital</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-light text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                            Statement
                        </h2>
                        <div className="text-sm space-y-1">
                            <p>
                                <span className="text-gray-400 dark:text-gray-500">
                                    Date:
                                </span>{" "}
                                {new Date().toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                            <p>
                                <span className="text-gray-400 dark:text-gray-500">
                                    Account No:
                                </span>{" "}
                                <span className="font-mono font-bold dark:text-white print-text-dark">
                                    {account.accountNumber}
                                </span>
                            </p>
                            <p>
                                <span className="text-gray-400 dark:text-gray-500">
                                    Currency:
                                </span>{" "}
                                {account.currency}
                            </p>
                        </div>
                    </div>
                </div>

                {}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-gray-100 dark:border-slate-800 print-border-light transition-colors">
                    <div>
                        <h3 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">
                            Statement For
                        </h3>
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700 print-border-light print:bg-gray-50 transition-colors">
                            <p className="text-xl font-bold text-gray-900 dark:text-white print-text-dark">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 print-text-gray mt-1">
                                {user?.email}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 leading-relaxed uppercase tracking-tighter">
                                Registered Address Verified via KYC Records
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                                Opening Balance
                            </p>
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200 print-text-dark">
                                {symbol}
                                {openingBalance.toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                                Closing Balance
                            </p>
                            <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                                {symbol}
                                {account.balance.toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase">
                                Total Credits (+)
                            </p>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 print-text-dark">
                                {symbol}
                                {totalCredits.toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase">
                                Total Debits (-)
                            </p>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 print-text-dark">
                                {symbol}
                                {totalDebits.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {}
                <div className="p-8">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-200 dark:border-slate-700 print-border-light transition-colors">
                                <th className="py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase pl-2">
                                    Date / Time
                                </th>
                                <th className="py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                                    Details / Memo
                                </th>
                                <th className="py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase text-right">
                                    Debit
                                </th>
                                <th className="py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase text-right">
                                    Credit
                                </th>
                                <th className="py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase text-right pr-2">
                                    Balance
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 print-border-light transition-colors">
                            {entries.map((entry, idx) => (
                                <tr key={entry._id} className="text-xs">
                                    <td className="py-4 pl-2">
                                        <p className="font-bold text-gray-900 dark:text-gray-100 print-text-dark">
                                            {new Date(
                                                entry.createdAt,
                                            ).toLocaleDateString("en-GB")}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 print-text-gray">
                                            {new Date(
                                                entry.createdAt,
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </td>
                                    <td className="py-4 max-w-[200px]">
                                        <p className="font-bold text-gray-800 dark:text-gray-200 print-text-dark">
                                            {entry.memo ||
                                                (entry.entryType === "Credit"
                                                    ? "Deposit"
                                                    : "Withdrawal")}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 print-text-gray font-mono uppercase truncate">
                                            {entry.transactionId?.referenceId ||
                                                "N/A"}
                                        </p>
                                    </td>
                                    <td className="py-4 text-right text-rose-600 dark:text-rose-400">
                                        {entry.entryType === "Debit"
                                            ? `${symbol}${entry.amount.toLocaleString()}`
                                            : ""}
                                    </td>
                                    <td className="py-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                                        {entry.entryType === "Credit"
                                            ? `${symbol}${entry.amount.toLocaleString()}`
                                            : ""}
                                    </td>
                                    <td className="py-4 text-right font-bold text-gray-900 dark:text-white print-text-dark pr-2">
                                        {symbol}
                                        {entry.balanceAfter.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {entries.length === 0 && (
                        <div className="py-20 text-center border-b border-gray-100 dark:border-slate-800 print-border-light border-dashed transition-colors">
                            <p className="text-gray-400 dark:text-gray-500 italic">
                                No transactions recorded for this period.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-gray-50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 print-border-light print:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-end">
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 print-text-gray space-y-1">
                            <p>
                                • This is a computer generated document and does
                                not require a physical signature.
                            </p>
                            <p>
                                • For any discrepancies, please notify the bank
                                within 15 days of the statement date.
                            </p>
                            <p>
                                • VaultPay Bank is a licensed digital entity
                                regulated under the Digital Banking Framework.
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                                Generated On
                            </p>
                            <p className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400 print-text-gray">
                                {
                                    new Date()
                                        .toISOString()
                                        .replace("T", " ")
                                        .split(".")[0]
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto py-12 text-center text-gray-400 dark:text-gray-600 text-xs no-print transition-colors">
                <p>
                    © 2026 VaultPay Digital Banking Solutions. All rights
                    reserved.
                </p>
            </div>
        </div>
    );
}
