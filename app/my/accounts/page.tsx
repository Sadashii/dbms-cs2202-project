"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { ReuploadModal } from "@/components/ReuploadModal";
import { useAccounts } from "@/hooks/useAccounts";

export default function AccountsPage() {
    const {
        user, isLoading, authLoading,
        accounts, page, setPage, totalPages, total,
        kycs, accountRequests, schedules,
        isTransferModalOpen, setIsTransferModalOpen,
        isTransferring, transferError,
        fromAccountId, setFromAccountId,
        toAccountNumber, setToAccountNumber,
        amount, setAmount, memo, setMemo,
        saveBeneficiary, setSaveBeneficiary,
        beneficiaryNickName, setBeneficiaryNickName,
        isScheduled, setIsScheduled,
        frequency, setFrequency,
        startDate, setStartDate,
        isNewAccountModalOpen, setIsNewAccountModalOpen,
        isSubmittingKYC, kycStatus,
        newAccountType, setNewAccountType,
        isReuploadModalOpen, setIsReuploadModalOpen,
        reuploadDocType, setReuploadDocType,
        panFile, setPanFile, panNumber, setPanNumber,
        aadharFile, setAadharFile, aadharNumber, setAadharNumber,
        signatureFile, setSignatureFile,
        fetchKycs, fetchSchedules, fetchHistory,
        handleTransfer, updateScheduleStatus,
        handleRequestAccount, handleWithdrawRequest, closeKycModal,
        router,
    } = useAccounts();

    if (authLoading || isLoading)
        return (
            <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in transition-colors">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Accounts</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your balances and execute transfers.</p>
                    {user?.customerId && (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                            Customer ID: <span className="font-mono">{user.customerId}</span>
                        </p>
                    )}
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsNewAccountModalOpen(true)} variant="outline" className="dark:bg-transparent dark:border-slate-700 dark:text-white dark:hover:bg-slate-800">
                        Open a New Account
                    </Button>
                    <Button onClick={() => setIsTransferModalOpen(true)} variant="primary">New Transfer</Button>
                </div>
            </div>

            {/* Account Request Status Banners */}
            {accountRequests.filter((req) => req.currentStatus !== "Approved").map((accountRequest) => (
                <div key={accountRequest._id} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-6 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-blue-900 dark:text-blue-400">
                                Account Request Status: {accountRequest.currentStatus.replace("_", " ")}
                            </h2>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Tracking progress for your {accountRequest.accountType} account.
                            </p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${accountRequest.currentStatus === "Rejected" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"}`}>
                                {accountRequest.currentStatus}
                            </span>
                            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/30" onClick={() => handleWithdrawRequest(accountRequest._id)}>
                                Withdraw Request
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {["PAN", "Aadhar", "Signature"].map((type) => {
                            const kyc = kycs.find((k) => k.documentType === type && k.accountRequestId === accountRequest._id) || (type === "Signature" ? { currentStatus: "Verified" } : null);
                            const status = kyc?.currentStatus || "Not Submitted";
                            return (
                                <div key={type} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-blue-100 dark:border-slate-800 flex flex-col justify-between transition-colors">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">{type} Document</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${status === "Verified" ? "bg-green-500" : status === "Rejected" ? "bg-red-500" : "bg-orange-500"}`}></span>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{status}</p>
                                        </div>
                                    </div>
                                    {status === "Rejected" && (
                                        <div className="mt-3">
                                            <p className="text-[10px] text-red-600 dark:text-red-400 mb-2">{kyc?.metadata?.rejectionReason || "Please re-upload clear image."}</p>
                                            <Button variant="outline" size="sm" className="w-full text-[10px] py-1 h-auto dark:border-slate-700 dark:text-white dark:hover:bg-slate-800" onClick={() => { setReuploadDocType(type); setIsReuploadModalOpen(true); }}>
                                                Fix & Re-upload
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {accounts.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl shadow-sm transition-colors">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No accounts yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">Verify your identity to get started.</p>
                        <Button onClick={() => setIsNewAccountModalOpen(true)} variant="primary">Open a New Account</Button>
                    </div>
                ) : (
                    accounts.map((acc) => (
                        <div key={acc._id} className="bg-white dark:bg-slate-900 overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 relative transition-colors">
                            {acc.currentStatus !== "Active" && (
                                <div className="absolute top-0 right-0 bg-red-100 dark:bg-red-900/80 text-red-800 dark:text-red-200 text-xs font-bold px-2 py-1 rounded-bl-lg z-10">{acc.currentStatus}</div>
                            )}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{acc.accountType}</h3>
                                        <p className="text-sm font-mono text-gray-500 dark:text-gray-400">{acc.accountNumber}</p>
                                    </div>
                                    <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center border border-blue-100 dark:border-blue-800/50 transition-colors">
                                        <span className="text-blue-700 dark:text-blue-400 font-bold text-xs">{acc.currency}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Available Balance</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                    {acc.currency === "INR" ? "₹" : acc.currency === "USD" ? "$" : "€"}
                                    {acc.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </p>
                                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-2 transition-colors">
                                    <Button variant="outline" className="w-full text-xs shadow-none py-1.5 h-auto text-gray-600 dark:text-gray-300 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => fetchHistory(acc)}>History</Button>
                                    <Button variant="outline" className="w-full text-xs shadow-none py-1.5 h-auto text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={() => router.push(`/my/accounts/statement/${acc._id}`)}>Statement</Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 px-5 py-3 shadow-sm transition-colors">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{total} account{total !== 1 ? "s" : ""} total</p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="py-1 h-auto text-xs dark:bg-transparent dark:border-slate-700 dark:text-white dark:hover:bg-slate-800">← Previous</Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400 px-2">{page} / {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="py-1 h-auto text-xs dark:bg-transparent dark:border-slate-700 dark:text-white dark:hover:bg-slate-800">Next →</Button>
                    </div>
                </div>
            )}

            {/* Scheduled Transfers */}
            {schedules.length > 0 && (
                <div className="pt-8 border-t border-gray-200 dark:border-slate-800 transition-colors">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Auto-Payments</h2>
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                                <tr>
                                    {["Payment Detail", "How often", "Next Payment", "Status", "Actions"].map((h) => (
                                        <th key={h} className={`p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                {schedules.map((sch) => (
                                    <tr key={sch._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{sch.currency} {sch.amount.$numberDecimal || sch.amount}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">To: {sch.beneficiaryId || "Saved Person"}</div>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">{sch.frequency}</td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{new Date(sch.nextRunDate).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${sch.currentStatus === "Active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : sch.currentStatus === "Paused" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>{sch.currentStatus}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {sch.currentStatus !== "Cancelled" && (
                                                <div className="flex justify-end gap-2">
                                                    <Button type="button" variant="outline" size="sm" className="text-xs py-1 h-auto dark:border-slate-700 dark:text-white dark:hover:bg-slate-800" onClick={() => updateScheduleStatus(sch._id, sch.currentStatus === "Active" ? "Paused" : "Active")}>
                                                        {sch.currentStatus === "Active" ? "Pause" : "Resume"}
                                                    </Button>
                                                    <Button type="button" variant="outline" size="sm" className="text-xs py-1 h-auto text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => updateScheduleStatus(sch._id, "Cancelled")}>Cancel</Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* New Account / KYC Modal */}
            <Modal isOpen={isNewAccountModalOpen} onClose={closeKycModal} title="Open New Account" description={kycStatus === "pending" ? "" : "Please verify your identity to open this account."}>
                {kycStatus === "pending" ? (
                    <div className="py-8 text-center space-y-4 animate-fade-in">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4"><svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Verification Pending</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 px-4">Your account request and documents have been submitted. Our team will verify them shortly.</p>
                        <div className="pt-6"><Button onClick={closeKycModal} variant="outline" className="w-full">Close Window</Button></div>
                    </div>
                ) : (
                    <form onSubmit={handleRequestAccount} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                            <select className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" value={newAccountType} onChange={(e) => setNewAccountType(e.target.value)} disabled={isSubmittingKYC}>
                                <option value="Savings">Savings Account</option>
                                <option value="Current">Current Account</option>
                                <option value="Fixed">Fixed Deposit</option>
                            </select>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar transition-colors">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">Identity Verification Details</h4>
                            <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-slate-700">
                                <Input label="PAN Number" type="text" value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} required disabled={isSubmittingKYC} placeholder="ABCDE1234F" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PAN Card Image</label>
                                    <input type="file" accept="image/*,.pdf" onChange={(e) => setPanFile(e.target.files?.[0] || null)} required disabled={isSubmittingKYC} className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none" />
                                </div>
                            </div>
                            <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-slate-700">
                                <Input label="Aadhar Number" type="text" value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, ""))} required disabled={isSubmittingKYC} placeholder="[Aadhaar Redacted]" maxLength={12} />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aadhar Card Image</label>
                                    <input type="file" accept="image/*,.pdf" onChange={(e) => setAadharFile(e.target.files?.[0] || null)} required disabled={isSubmittingKYC} className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Signature Image</label>
                                <input type="file" accept="image/*" onChange={(e) => setSignatureFile(e.target.files?.[0] || null)} required disabled={isSubmittingKYC} className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none" />
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-slate-700 mt-6">
                            <Button type="button" variant="ghost" onClick={closeKycModal} disabled={isSubmittingKYC}>Cancel</Button>
                            <Button type="submit" variant="primary" isLoading={isSubmittingKYC}>Submit Documents</Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Transfer Modal */}
            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer Funds" description="Move money between your accounts or to a saved recipient.">
                <form onSubmit={handleTransfer} className="space-y-4">
                    {transferError && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-md">{transferError}</div>}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Account</label>
                        <select className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none" value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required>
                            <option value="" disabled>Select Account</option>
                            {accounts.filter((a) => a.currentStatus === "Active").map((acc) => (
                                <option key={acc._id} value={acc._id}>{acc.accountType} - {acc.accountNumber} ({acc.currency} {acc.balance.toLocaleString()})</option>
                            ))}
                        </select>
                    </div>
                    <Input label="To Account Number" type="text" value={toAccountNumber} onChange={(e) => setToAccountNumber(e.target.value)} placeholder="Recipient Account Number" required />
                    <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required min="0.01" step="0.01" />
                    <Input label="Memo / Note" type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="What is this for?" />
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="saveBeneficiary" checked={saveBeneficiary} onChange={(e) => setSaveBeneficiary(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="saveBeneficiary" className="text-sm font-medium text-gray-700 dark:text-gray-300">Save for later</label>
                        </div>
                        {saveBeneficiary && <Input label="Recipient Shortcut Name" value={beneficiaryNickName} onChange={(e) => setBeneficiaryNickName(e.target.value)} placeholder="e.g. John's Rent" required={saveBeneficiary} />}
                        <div className="border-t border-gray-200 dark:border-slate-700 pt-3 flex items-center gap-2">
                            <input type="checkbox" id="isScheduled" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="isScheduled" className="text-sm font-medium text-gray-700 dark:text-gray-300">Make this a repeating payment</label>
                        </div>
                        {isScheduled && (
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">How often</label>
                                    <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                                        <option value="Daily">Daily</option>
                                        <option value="Weekly">Weekly</option>
                                        <option value="Monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required={isScheduled} className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setIsTransferModalOpen(false)} className="w-full">Cancel</Button>
                        <Button type="submit" variant="primary" isLoading={isTransferring} className="w-full">Confirm Transfer</Button>
                    </div>
                </form>
            </Modal>

            {/* Reupload Modal */}
            {isReuploadModalOpen && (
                <ReuploadModal isOpen={isReuploadModalOpen} onClose={() => setIsReuploadModalOpen(false)} documentType={reuploadDocType} onSuccess={() => { setIsReuploadModalOpen(false); fetchKycs(); }} />
            )}
        </div>
    );
}
