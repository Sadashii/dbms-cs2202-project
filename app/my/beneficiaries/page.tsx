"use client";

import React from "react";
import { useBeneficiaries } from "@/hooks/useBeneficiaries";

const initials = (name: string) =>
    name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

const AVATAR_COLORS = [
    "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
    "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
    "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300",
];

function avatarColor(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function BeneficiariesPage() {
    const {
        beneficiaries,
        isLoading,
        authLoading,
        search, setSearch,
        isAddOpen, setIsAddOpen,
        addForm, setAddForm,
        isSaving,
        renameId, setRenameId,
        renameValue, setRenameValue,
        isRenaming,
        deleteId, setDeleteId,
        isDeleting,
        filtered,
        handleAdd,
        handleRename,
        handleDelete
    } = useBeneficiaries();

    if (authLoading || isLoading) {
        return (
            <div className="py-24 flex justify-center">
                <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600 dark:border-blue-400" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-7 animate-fade-in transition-colors pb-14">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Saved Recipients</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage the people you pay often for quick internal transfers.</p>
                </div>
                <button
                    id="add-beneficiary-btn"
                    onClick={() => setIsAddOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Recipient
                </button>
            </div>

            <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 10a6.65 6.65 0 11-13.3 0 6.65 6.65 0 0113.3 0z" /></svg>
                <input
                    id="beneficiary-search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by nickname, name, or account number..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>

            {filtered.length === 0 && (
                <div className="py-20 text-center bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm">
                    <div className="mx-auto w-14 h-14 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded-full mb-4">
                        <svg className="w-7 h-7 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{search ? "No matches found" : "No saved recipients yet"}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">{search ? "Try a different search term." : "Save a VaultPay payee once and transfer to them instantly."}</p>
                    {!search && (
                        <button onClick={() => setIsAddOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Add Your First Recipient
                        </button>
                    )}
                </div>
            )}

            {filtered.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((b) => {
                        const isRenaming_ = renameId === b._id;
                        const isDeleting_ = deleteId === b._id;
                        return (
                            <div key={b._id} className="group bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md dark:hover:shadow-slate-800/60 transition-all p-5 flex flex-col gap-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${avatarColor(b._id)}`}>{initials(b.accountName)}</div>
                                    <div className="min-w-0 flex-1">
                                        {isRenaming_ ? (
                                            <div className="flex gap-1.5 items-center">
                                                <input
                                                    id={`rename-input-${b._id}`}
                                                    autoFocus
                                                    value={renameValue}
                                                    onChange={(e) => setRenameValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleRename(b._id);
                                                        if (e.key === "Escape") setRenameId(null);
                                                    }}
                                                    className="flex-1 text-sm font-semibold bg-gray-50 dark:bg-slate-800 border border-blue-400 rounded-lg px-2 py-1 text-gray-900 dark:text-white outline-none"
                                                />
                                                <button onClick={() => handleRename(b._id)} disabled={isRenaming} className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50" title="Save">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                </button>
                                                <button onClick={() => setRenameId(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" title="Cancel">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{b.nickName}</p>
                                        )}
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{b.accountName}</p>
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                                    <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold text-[10px]">Account No.</span><span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{b.accountNumber}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold text-[10px]">Network</span><span className="font-medium text-gray-700 dark:text-gray-300">VaultPay Internal</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold text-[10px]">Added</span><span className="text-gray-500 dark:text-gray-400">{new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                                </div>

                                <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-slate-800">
                                    <button
                                        id={`rename-btn-${b._id}`}
                                        onClick={() => { setRenameId(b._id); setRenameValue(b.nickName); setDeleteId(null); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        Rename
                                    </button>

                                    {isDeleting_ ? (
                                        <div className="flex-1 flex items-center gap-1.5">
                                            <button onClick={() => handleDelete(b._id)} disabled={isDeleting} className="flex-1 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">{isDeleting ? "..." : "Confirm"}</button>
                                            <button onClick={() => setDeleteId(null)} className="flex-1 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                                        </div>
                                    ) : (
                                        <button
                                            id={`delete-btn-${b._id}`}
                                            onClick={() => { setDeleteId(b._id); setRenameId(null); }}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {beneficiaries.length > 0 && <p className="text-xs text-gray-400 dark:text-gray-500 text-center">{filtered.length === beneficiaries.length ? `${beneficiaries.length} saved recipient${beneficiaries.length === 1 ? "" : "s"}` : `Showing ${filtered.length} of ${beneficiaries.length}`}</p>}

            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 animate-fade-in">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                            <div><h2 className="text-base font-bold text-gray-900 dark:text-white">Add Recipient</h2><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Save a person for quick transfers.</p></div>
                            <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            {[
                                { id: "nickName", label: "Nickname *", placeholder: "e.g. Mom's Account", required: true },
                                { id: "accountNumber", label: "Account Number *", placeholder: "Enter account number", required: true },
                                { id: "accountName", label: "Account Holder Name *", placeholder: "Full name as per bank records", required: true },
                            ].map(({ id, label, placeholder, required }) => (
                                <div key={id}>
                                    <label htmlFor={`add-${id}`} className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                                    <input
                                        id={`add-${id}`}
                                        type="text"
                                        required={required}
                                        placeholder={placeholder}
                                        value={addForm[id as keyof typeof addForm]}
                                        onChange={(e) => setAddForm((f) => ({ ...f, [id]: e.target.value }))}
                                        disabled={isSaving}
                                        className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-60"
                                    />
                                </div>
                            ))}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsAddOpen(false)} disabled={isSaving} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                                    {isSaving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</> : "Save Recipient"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
