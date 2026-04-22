import React from "react";
import { Button } from "@/components/ui/button";
import { useCards } from "@/hooks/useCards";

interface CardDetailsProps {
    hookState: ReturnType<typeof useCards>;
}

export const CardDetails: React.FC<CardDetailsProps> = ({ hookState }) => {
    const {
        selectedCard,
        activeTab, setActiveTab,
        handleToggleStatus,
        handleDeleteCard,
        isUpdatingFeature,
        handleToggleFeature,
        openLimitModal,
        setIsPinModalOpen,
        setIsExpenseModalOpen,
        setIsRepayModalOpen,
        isTransactionsLoading,
        cardTransactions
    } = hookState;

    if (!selectedCard) return null;

    return (
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 transition-colors">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">
                        {selectedCard.cardNetwork} {selectedCard.cardType}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono transition-colors">
                        Ending in {selectedCard.maskedNumber.slice(-4)}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span
                        className={`px-3 py-1 text-xs font-bold rounded-full ${selectedCard.currentStatus === "Active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : selectedCard.currentStatus === "Closed" ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                    >
                        {selectedCard.currentStatus}
                    </span>
                    {selectedCard.currentStatus !== "Closed" && (
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleToggleStatus(selectedCard._id, selectedCard.currentStatus)}
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase tracking-wider"
                            >
                                {selectedCard.currentStatus === "Active" ? "Freeze" : "Unfreeze"}
                            </button>

                            <button
                                onClick={() => handleDeleteCard(selectedCard._id)}
                                className={`text-xs font-bold transition-colors uppercase tracking-wider ${
                                    selectedCard.currentStatus === "Blocked"
                                        ? selectedCard.cardType === "Credit" && (selectedCard.limits?.outstandingAmount || 0) > 0
                                            ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                            : "text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400"
                                        : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                }`}
                                title={
                                    selectedCard.currentStatus !== "Blocked"
                                        ? "Freeze card first"
                                        : selectedCard.cardType === "Credit" && (selectedCard.limits?.outstandingAmount || 0) > 0
                                            ? "Clear balance first"
                                            : ""
                                }
                            >
                                Permanent Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
                <button
                    onClick={() => setActiveTab("controls")}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "controls" ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
                >
                    Settings & Controls
                </button>
                <button
                    onClick={() => setActiveTab("transactions")}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "transactions" ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
                >
                    Recent Transactions
                </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-gray-50/30 dark:bg-slate-900/50 transition-colors">
                {activeTab === "controls" && (
                    <div className="space-y-6 animate-fade-in">
                        {selectedCard.cardType === "Credit" && (
                            <div className="bg-indigo-900 border border-indigo-700 p-6 rounded-2xl text-white shadow-lg animate-fade-in relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-1">
                                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">
                                            Total Outstanding
                                        </p>
                                        <h3 className="text-3xl font-black">
                                            ₹ {selectedCard.limits?.outstandingAmount?.toLocaleString()}
                                        </h3>
                                        <p className="text-indigo-200/60 text-[10px] font-mono">
                                            Limit: ₹ {selectedCard.limits?.creditLimit?.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <Button
                                            onClick={() => setIsRepayModalOpen(true)}
                                            className="flex-1 md:flex-none bg-emerald-500 text-white hover:bg-emerald-400 font-bold border-none shadow-lg shadow-emerald-900/20"
                                        >
                                            Make Repayment
                                        </Button>
                                        <Button
                                            onClick={() => setIsExpenseModalOpen(true)}
                                            className="flex-1 md:flex-none bg-indigo-700 hover:bg-indigo-600 text-white font-bold border-indigo-500 border"
                                        >
                                            Create Expense
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-6 w-full h-1.5 bg-indigo-950 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-1000"
                                        style={{
                                            width: `${Math.min(100, ((selectedCard.limits?.outstandingAmount || 0) / (selectedCard.limits?.creditLimit || 1)) * 100)}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {selectedCard.cardType === "Debit" && selectedCard.currentStatus === "Active" && (
                            <div className="flex gap-4">
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsExpenseModalOpen(true)}
                                    className="flex-1 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50 shadow-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                    <svg
                                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        ></path>
                                    </svg>
                                    Create Dummy Expense
                                </Button>
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-800/50 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4 border-b border-gray-100 dark:border-slate-700 pb-4">
                                <div>
                                    <h4 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <svg
                                            className="w-5 h-5 text-blue-600 dark:text-blue-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                                            ></path>
                                        </svg>
                                        Spending Limits
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Control your daily transaction caps.
                                    </p>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => openLimitModal(selectedCard)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2"
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
                                            strokeWidth="2"
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        ></path>
                                    </svg>
                                    Edit Limits
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="border border-blue-100 dark:border-blue-800/30 rounded-xl p-4 bg-blue-50/50 dark:bg-blue-900/20 transition-colors">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                        Daily Online
                                    </p>
                                    <p className="font-bold text-gray-900 dark:text-white text-xl">
                                        ₹ {selectedCard.limits?.dailyOnlineLimit?.toLocaleString() || "100,000"}
                                    </p>
                                </div>
                                <div className="border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-4 bg-indigo-50/50 dark:bg-indigo-900/20 transition-colors">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                        Daily ATM
                                    </p>
                                    <p className="font-bold text-gray-900 dark:text-white text-xl">
                                        ₹ {selectedCard.limits?.dailyWithdrawalLimit?.toLocaleString() || "50,000"}
                                    </p>
                                </div>
                                <div className="border border-teal-100 dark:border-teal-800/30 rounded-xl p-4 bg-teal-50/50 dark:bg-teal-900/20 transition-colors">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                        Contactless
                                    </p>
                                    <p className="font-bold text-gray-900 dark:text-white text-xl">
                                        ₹ {selectedCard.limits?.contactlessLimit?.toLocaleString() || "5,000"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800/50 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                                Security Features
                            </h4>
                            <div className="space-y-3">
                                <div
                                    className={`flex items-center justify-between p-3 border border-gray-100 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${isUpdatingFeature ? "opacity-50 pointer-events-none" : ""}`}
                                    onClick={() => handleToggleFeature("online")}
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            Online Transactions
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Allow payments on e-commerce sites.
                                        </p>
                                    </div>
                                    <div
                                        className={`w-11 h-6 rounded-full relative shadow-inner transition-colors duration-300 ${selectedCard.isOnlineEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-slate-600"}`}
                                    >
                                        <div
                                            className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow transition-transform duration-300 ${selectedCard.isOnlineEnabled ? "translate-x-6" : "translate-x-1"}`}
                                        ></div>
                                    </div>
                                </div>

                                <div
                                    className={`flex items-center justify-between p-3 border border-gray-100 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${isUpdatingFeature ? "opacity-50 pointer-events-none" : ""}`}
                                    onClick={() => handleToggleFeature("international")}
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            International Usage
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Allow transactions in foreign currencies.
                                        </p>
                                    </div>
                                    <div
                                        className={`w-11 h-6 rounded-full relative shadow-inner transition-colors duration-300 ${selectedCard.isInternationalEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-slate-600"}`}
                                    >
                                        <div
                                            className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow transition-transform duration-300 ${selectedCard.isInternationalEnabled ? "translate-x-6" : "translate-x-1"}`}
                                        ></div>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50/30 dark:bg-blue-900/20 rounded-xl border border-blue-100/50 dark:border-blue-800/30 mt-4 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                Virtual Security PIN
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                Enable/Change your 4-digit card PIN.
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-8 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 dark:bg-transparent dark:hover:bg-slate-800"
                                            onClick={() => setIsPinModalOpen(true)}
                                        >
                                            Set New PIN
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "transactions" && (
                    <div className="animate-fade-in space-y-4">
                        {isTransactionsLoading ? (
                            <div className="py-10 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                            </div>
                        ) : cardTransactions.length === 0 ? (
                            <div className="text-center p-10 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50 shadow-sm transition-colors">
                                <p className="font-medium">
                                    No recent transactions found.
                                </p>
                                <p className="text-xs mt-1">
                                    Simulate an expense to see it here.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm transition-colors">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700 transition-colors">
                                        <tr>
                                            <th className="px-6 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Merchant/Memo
                                            </th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                        {cardTransactions.map((tx) => (
                                            <tr
                                                key={tx._id}
                                                className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-gray-900 dark:text-gray-100 font-medium">
                                                        {new Date(tx.createdAt).toLocaleDateString("en-GB", {
                                                            day: "2-digit",
                                                            month: "short",
                                                        })}
                                                    </p>
                                                    <p className="text-[9px] text-gray-400 dark:text-gray-500">
                                                        {new Date(tx.createdAt).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-gray-900 dark:text-gray-100 font-semibold">
                                                        {tx.memo}
                                                    </p>
                                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-mono uppercase">
                                                        {tx.transaction?.referenceId}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p
                                                        className={`text-sm font-bold ${tx.entryType === "Debit" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                                                    >
                                                        {tx.entryType === "Debit" ? "-" : "+"} ₹{" "}
                                                        {tx.amount.toLocaleString()}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
