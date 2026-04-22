"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useAdminKYCDetail } from "@/hooks/useAdminKYCDetail";

export default function FocusedKYCPage() {
    const {
        bundle,
        isLoading,
        processingId,
        rejectingId, setRejectingId,
        rejectionReason, setRejectionReason,
        selectedDocumentId, setSelectedDocumentId,
        handleUpdateStatus,
        statusSummary,
        groupedDocuments,
        selectedDocument,
        selectedDocumentGroup,
        router
    } = useAdminKYCDetail();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }

    if (!bundle) return null;

    return (
        <div className="min-h-screen bg-white p-4 transition-colors duration-500 dark:bg-slate-950 md:p-8">
            <div className="mx-auto max-w-7xl space-y-8 animate-fade-in">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <Button
                            variant="ghost"
                            onClick={() => router.push("/admin/kyc")}
                            className="h-10 rounded-xl border border-gray-200 px-4 text-gray-500 dark:border-slate-800 dark:text-gray-400"
                        >
                            &larr; Back to Queue
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white">KYC Review Workspace</h1>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Review the customer document set, approve valid records, or reject a specific document with remediation guidance.</p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { label: "Verified", count: statusSummary.verified, color: "text-emerald-600 dark:text-emerald-400" },
                            { label: "Pending", count: statusSummary.pending, color: "text-amber-600 dark:text-amber-400" },
                            { label: "Rejected", count: statusSummary.rejected, color: "text-red-600 dark:text-red-400" },
                        ].map((s) => (
                            <div key={s.label} className="rounded-[1.75rem] border border-gray-100 bg-white px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:min-w-[8rem]">
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">{s.label}</p>
                                <p className={`mt-3 text-4xl font-black leading-none ${s.color}`}>{s.count}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid gap-8 xl:grid-cols-[1.05fr_1.95fr]">
                    <aside className="space-y-6">
                        <div className="rounded-[2rem] border border-gray-100 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="border-b pb-3 text-lg font-black uppercase tracking-tight text-gray-900 dark:border-slate-800 dark:text-white">Customer Snapshot</h2>
                            <div className="mt-6 space-y-5">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Name</p>
                                    <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">{bundle.user.firstName} {bundle.user.lastName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Email</p>
                                    <p className="mt-1 break-all text-sm font-medium text-gray-600 dark:text-gray-300">{bundle.user.email}</p>
                                </div>
                                {bundle.user.customerId && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Customer ID</p>
                                        <p className="mt-1 font-mono text-sm font-bold tracking-[0.18em] text-blue-600 dark:text-blue-400">{bundle.user.customerId}</p>
                                    </div>
                                )}
                                {bundle.accountRequest && (
                                    <>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Requested Account</p>
                                            <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{bundle.accountRequest.accountType}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Request Status</p>
                                            <span className="mt-2 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
                                                {bundle.accountRequest.currentStatus.replace("_", " ")}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-gray-100 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="border-b pb-3 text-[11px] font-black uppercase tracking-[0.22em] text-gray-400 dark:border-slate-800 dark:text-gray-500">Documents</h3>
                            <div className="mt-5 space-y-3">
                                {groupedDocuments.map((docs) => {
                                    const latestDoc = docs[0];
                                    const isSelected = selectedDocumentGroup.some((d) => d._id === latestDoc._id);
                                    return (
                                        <button
                                            key={latestDoc._id}
                                            type="button"
                                            onClick={() => setSelectedDocumentId(latestDoc._id)}
                                            className={`w-full rounded-[1.5rem] border p-4 text-left transition-all ${isSelected ? "border-blue-200 bg-blue-50 shadow-sm dark:border-blue-900/40 dark:bg-blue-900/20" : "border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/60 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-900/40 dark:hover:bg-blue-900/10"}`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-black text-gray-900 dark:text-white">{latestDoc.documentType}</p>
                                                    {docs.length > 1 && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[9px] font-bold text-gray-600 dark:bg-slate-800 dark:text-gray-400">v{docs.length}</span>}
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500">{latestDoc.currentStatus}</span>
                                            </div>
                                            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">{latestDoc.kycReference}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>

                    <section className="space-y-6">
                        {bundle.documents.length === 0 ? (
                            <div className="rounded-[2rem] border border-dashed border-gray-200 bg-white p-10 text-center text-sm font-medium text-gray-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-gray-400">No KYC documents were found for this customer.</div>
                        ) : selectedDocument ? (
                            (() => {
                                const document = selectedDocument;
                                const isSignature = document.documentType === "Signature";
                                const isRejecting = rejectingId === document._id;
                                const previewableAttachment = document.attachments?.[0];
                                const decodedNumber = document.documentDetails?.encryptedNumber && document.documentDetails.encryptedNumber !== "N/A"
                                    ? (() => { try { return atob(document.documentDetails.encryptedNumber!); } catch { return null; } })()
                                    : null;

                                return (
                                    <article key={document._id} className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
                                        <div className="border-b border-gray-100 px-6 py-5 dark:border-slate-800 md:px-8">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{document.documentType}</h2>
                                                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${document.currentStatus === "Verified" ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300" : document.currentStatus === "Rejected" ? "border-red-100 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300" : document.currentStatus === "In-Review" ? "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300" : "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"}`}>
                                                            {document.currentStatus}
                                                        </span>
                                                        {isSignature && <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">Auto Approved</span>}
                                                    </div>
                                                    <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">{document.kycReference}</p>
                                                </div>

                                                <div className="grid gap-3 text-sm text-gray-500 dark:text-gray-400 sm:grid-cols-2">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.22em]">Submitted</p>
                                                        <p className="mt-1 font-medium text-gray-700 dark:text-gray-200">{new Date(document.createdAt).toLocaleDateString()} {new Date(document.createdAt).toLocaleTimeString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.22em]">Last Update</p>
                                                        <p className="mt-1 font-medium text-gray-700 dark:text-gray-200">{new Date(document.updatedAt).toLocaleDateString()} {new Date(document.updatedAt).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-8 px-6 py-6 md:px-8 xl:grid-cols-[1.45fr_0.95fr]">
                                            <div className="space-y-5">
                                                <div className="rounded-[1.5rem] border border-gray-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                                    <div className="mb-4 flex items-center justify-between gap-4">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Uploaded Document</p>
                                                        {previewableAttachment?.fileUrl && <a href={previewableAttachment.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 hover:underline dark:text-blue-400">Open File</a>}
                                                    </div>

                                                    {previewableAttachment?.fileUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                        <div className="flex min-h-[18rem] items-center justify-center overflow-hidden rounded-[1.25rem] border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                                                            <img src={previewableAttachment.fileUrl} alt={`${document.documentType} preview`} className="max-h-[28rem] w-full object-contain" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-gray-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
                                                            <svg className="mb-3 h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Preview unavailable in-line</p>
                                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Open the uploaded file in a new tab to review the full document.</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {document.metadata?.rejectionReason && (
                                                    <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-5 dark:border-red-900/30 dark:bg-red-950/20">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-600 dark:text-red-400">Latest Rejection Reason</p>
                                                        <p className="mt-2 text-sm font-medium leading-relaxed text-red-700 dark:text-red-300">{document.metadata.rejectionReason}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-5">
                                                <div className="rounded-[1.5rem] border border-gray-200 bg-gray-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Document Details</p>
                                                    <div className="mt-4 space-y-4 text-sm">
                                                        {decodedNumber && (
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Document Number</p>
                                                                <p className="mt-1 font-mono font-bold tracking-[0.18em] text-gray-900 dark:text-white">{decodedNumber}</p>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Country</p>
                                                            <p className="mt-1 font-medium text-gray-700 dark:text-gray-200">{document.documentDetails?.issuedCountry || "India"}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Verification Ledger</p>
                                                    <div className="mt-4 space-y-4">
                                                        {(document.statusHistory || []).map((event, index) => (
                                                            <div key={`${document._id}-${index}`} className="flex gap-3">
                                                                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
                                                                <div>
                                                                    <p className="text-xs font-black uppercase text-gray-900 dark:text-white">{event.state}</p>
                                                                    {event.remarks && <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">{event.remarks}</p>}
                                                                    <p className="mt-1 text-[10px] font-mono uppercase text-gray-400 dark:text-gray-500">{new Date(event.updatedAt).toLocaleDateString()} {new Date(event.updatedAt).toLocaleTimeString()}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {selectedDocumentGroup.length > 1 && (
                                                        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-800">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500 mb-4">Version History</p>
                                                            <div className="space-y-3">
                                                                {selectedDocumentGroup.map((doc, idx) => {
                                                                    const isCurrent = doc._id === document._id;
                                                                    return (
                                                                        <div key={doc._id} className={`flex items-center justify-between p-3 rounded-xl border ${isCurrent ? "border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10" : "border-gray-100 bg-gray-50 dark:border-slate-800 dark:bg-slate-900/50"}`}>
                                                                            <div>
                                                                                <p className="text-xs font-bold text-gray-900 dark:text-white">Version {selectedDocumentGroup.length - idx}</p>
                                                                                <p className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mt-1">{doc.currentStatus}</p>
                                                                            </div>
                                                                            {!isCurrent && <Button variant="outline" size="sm" onClick={() => setSelectedDocumentId(doc._id)} className="h-7 text-[10px] font-black uppercase rounded-lg dark:border-slate-700">View Version</Button>}
                                                                            {isCurrent && <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 px-3">Viewing</span>}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Decision Controls</p>
                                                    {isSignature ? (
                                                        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-5 text-sm font-medium leading-relaxed text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-300">Signature verification is handled automatically. This document stays approved without employee intervention.</div>
                                                    ) : isRejecting ? (
                                                        <div className="mt-4 space-y-4">
                                                            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Explain exactly what needs to be corrected before re-upload." className="h-32 w-full resize-none rounded-2xl border border-gray-200 bg-slate-50 p-4 text-sm text-gray-900 outline-none transition-all focus:ring-2 focus:ring-red-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
                                                            <div className="flex gap-3">
                                                                <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => { setRejectingId(null); setRejectionReason(""); }}>Cancel</Button>
                                                                <Button variant="danger" className="flex-[1.4] rounded-xl" isLoading={processingId === document._id} onClick={() => handleUpdateStatus(document._id, "Rejected", rejectionReason)}>Confirm Rejection</Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-4 space-y-3">
                                                            <Button variant="primary" className="w-full rounded-2xl py-6 text-xs font-black uppercase tracking-[0.18em]" isLoading={processingId === document._id} onClick={() => handleUpdateStatus(document._id, "Verified")}>Approve Document</Button>
                                                            {document.currentStatus === "Pending" && <Button variant="outline" className="w-full rounded-2xl py-5 text-[10px] font-black uppercase tracking-[0.18em]" isLoading={processingId === document._id} onClick={() => handleUpdateStatus(document._id, "In-Review")}>Mark In Review</Button>}
                                                            <Button variant="outline" className="w-full rounded-2xl border-red-200 py-5 text-[10px] font-black uppercase tracking-[0.18em] text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => { setRejectingId(document._id); setRejectionReason(document.metadata?.rejectionReason || ""); }}>Reject Document</Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })()
                        ) : null}
                    </section>
                </div>
            </div>
        </div>
    );
}
