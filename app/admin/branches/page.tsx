"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useAdminBranches } from "@/hooks/useAdminBranches";

export default function AdminBranchesPage() {
    const {
        user,
        branches,
        isLoading,
        isUsersLoading,
        selectedBranchId, setSelectedBranchId,
        roleFilter, setRoleFilter,
        searchQuery, setSearchQuery,
        isAddModalOpen, setIsAddModalOpen,
        isAssignModalOpen, setIsAssignModalOpen,
        isSubmitting,
        selectedUser,
        branchName, setBranchName,
        branchCode, setBranchCode,
        branchType, setBranchType,
        email, setEmail,
        phone, setPhone,
        street, setStreet,
        city, setCity,
        state, setState,
        zipCode, setZipCode,
        latitude, setLatitude,
        longitude, setLongitude,
        assignBranchId, setAssignBranchId,
        assignRole, setAssignRole,
        handleAddBranch,
        handleAssignUser,
        openAssignModal,
        filteredUsers,
        totalGlobalLoanVolume,
        totalGlobalTxVolume,
    } = useAdminBranches();

    if (!user || !["Admin", "Manager", "Employee"].includes(user.role)) {
        return <div className="p-8 text-red-500 font-bold">Unauthorized.</div>;
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-8 transition-colors duration-500 space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Operations Dashboard</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Monitoring the VaultPay Global Network</p>
                </div>

                <div className="flex flex-wrap gap-6 items-center">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Global Portfolio</p>
                        <p className="text-lg font-black text-blue-600 dark:text-blue-400">₹{totalGlobalLoanVolume.toLocaleString()}</p>
                    </div>
                    <div className="hidden sm:block h-10 w-px bg-gray-100 dark:bg-slate-800"></div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Network Txs</p>
                        <p className="text-lg font-black text-gray-900 dark:text-white">{totalGlobalTxVolume.toLocaleString()}</p>
                    </div>
                    {user.role === "Admin" && (
                        <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 font-bold px-5 rounded-xl">Add Branch</Button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex gap-4 min-w-max">
                    <div
                        onClick={() => setSelectedBranchId("")}
                        className={`min-w-[200px] p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between h-28 ${selectedBranchId === "" ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-[1.02]" : "bg-white dark:bg-slate-900 text-gray-900 dark:text-white border-gray-100 dark:border-slate-800 hover:border-blue-500"}`}
                    >
                        <p className={`text-[10px] font-bold uppercase ${selectedBranchId === "" ? "opacity-80" : "text-gray-400"}`}>Global View</p>
                        <p className="text-lg font-black tracking-tight leading-tight">All Regions</p>
                    </div>

                    {branches.map((b) => (
                        <div
                            key={b._id}
                            onClick={() => setSelectedBranchId(b._id)}
                            className={`min-w-[240px] p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between h-28 ${selectedBranchId === b._id ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-[1.02]" : "bg-white dark:bg-slate-900 text-gray-900 dark:text-white border-gray-100 dark:border-slate-800 hover:border-blue-500 group shadow-sm"}`}
                        >
                            <div className="flex justify-between items-start">
                                <p className={`text-[10px] font-bold uppercase ${selectedBranchId === b._id ? "opacity-80" : "text-gray-400"}`}>{b.branchCode}</p>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase ${selectedBranchId === b._id ? "bg-blue-400 text-white" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400"}`}>{b.branchType}</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold truncate mb-1">{b.branchName}</p>
                                <p className={`text-xs font-black ${selectedBranchId === b._id ? "text-white/90" : "text-blue-600 dark:text-blue-400"}`}>₹{(b.totalLoanVolume || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden flex flex-col transition-colors">
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <h2 className="font-black text-gray-900 dark:text-white tracking-tight">Access Control</h2>
                        <div className="flex flex-wrap rounded-xl bg-gray-200/50 dark:bg-slate-950 p-1">
                            {["", "Employee", "Manager", "Customer"].map((r) => (
                                <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${roleFilter === r ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                                    {r || "All Entities"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <input type="text" placeholder="Search identification..." className="w-full md:w-64 pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-medium transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50/10 dark:bg-slate-800/30 text-gray-400 dark:text-gray-500">
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Principal Identity</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Authority Level</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Affiliation</th>
                                <th className="p-5 text-right text-[10px] font-black uppercase tracking-widest">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800 transition-colors">
                            {isUsersLoading ? (
                                <tr><td colSpan={5} className="p-16 text-center"><div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-bold uppercase italic tracking-widest">No matching records</td></tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 group transition-colors">
                                        <td className="p-5">
                                            <div className="font-black text-gray-900 dark:text-white border-l-4 border-transparent group-hover:border-blue-500 pl-3 transition-all">{u.firstName} {u.lastName}</div>
                                            <div className="text-xs text-gray-400 dark:text-gray-500 ml-3">{u.email}</div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${u.role === "Admin" ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-100" : u.role === "Manager" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100" : "bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-slate-700"}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                {branches.find((b) => b._id === u.branchId)?.branchName || "Remote Core"}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <Button variant="outline" size="sm" className="text-[10px] font-black uppercase py-1.5 h-auto rounded-xl dark:border-slate-700 dark:text-white" onClick={() => openAssignModal(u)}>Provision</Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => !isSubmitting && setIsAddModalOpen(false)}
                title="Establish New Branch Node"
            >
                <form
                    onSubmit={handleAddBranch}
                    className="space-y-6 max-h-[80vh] overflow-y-auto pr-4 custom-scrollbar p-1"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                Identity & Type
                            </h4>
                            <Input
                                label="Branch Name"
                                placeholder="e.g. Mumbai Corporate Hub"
                                value={branchName}
                                onChange={(e) => setBranchName(e.target.value)}
                                required
                            />
                            <Input
                                label="Branch Code"
                                placeholder="e.g. BOM001"
                                value={branchCode}
                                onChange={(e) =>
                                    setBranchCode(e.target.value.toUpperCase())
                                }
                                required
                            />
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                                    Branch Category
                                </label>
                                <select
                                    className="w-full border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold"
                                    value={branchType}
                                    onChange={(e) => setBranchType(e.target.value)}
                                >
                                    <option value="Main">Main Branch</option>
                                    <option value="Mini">Mini Branch</option>
                                    <option value="ATM_Only">ATM Service Point</option>
                                    <option value="Digital">Digital Support Center</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                Contact Information
                            </h4>
                            <Input
                                label="Support Email"
                                type="email"
                                placeholder="branch@vaultpay.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Input
                                label="Support Number"
                                placeholder="+91 XXXXX XXXXX"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl space-y-6 border border-gray-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                            Geographic Presence
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Input
                                    label="Street Address"
                                    placeholder="Building, Street Name"
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    required
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="City"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="State"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        required
                                    />
                                </div>
                                <Input
                                    label="Zip Code"
                                    value={zipCode}
                                    onChange={(e) => setZipCode(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800 space-y-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Precision Coordinates</p>
                                    <Input
                                        label="Latitude"
                                        type="number"
                                        step="any"
                                        placeholder="19.0760"
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                    />
                                    <Input
                                        label="Longitude"
                                        type="number"
                                        step="any"
                                        placeholder="72.8777"
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-500 italic">Used for global mapping visualizers</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsAddModalOpen(false)}
                            className="rounded-xl font-bold uppercase text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting}
                            className="rounded-xl px-10 font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20"
                        >
                            Deploy Branch
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isAssignModalOpen} onClose={() => !isSubmitting && setIsAssignModalOpen(false)} title="Principal Override">
                <form onSubmit={handleAssignUser} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Authority Level</label>
                        <select className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" value={assignRole} onChange={(e) => setAssignRole(e.target.value)}>
                            <option value="Customer" className="dark:bg-slate-900">Standard Principal (Customer)</option>
                            <option value="Employee" className="dark:bg-slate-900">Operational Agent (Employee)</option>
                            <option value="Manager" className="dark:bg-slate-900">Node Commander (Manager)</option>
                            {user.role === "Admin" && <option value="Admin" className="dark:bg-slate-900">System Core (Admin)</option>}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Branch Affiliation</label>
                        <select className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" value={assignBranchId} onChange={(e) => setAssignBranchId(e.target.value)}>
                            <option value="" className="dark:bg-slate-900">Detached Source (No Branch)</option>
                            {branches.map((b) => (
                                <option key={b._id} value={b._id} className="dark:bg-slate-900">{b.branchName} ({b.branchCode})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                        <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)} className="rounded-xl dark:text-gray-400">Discard</Button>
                        <Button type="submit" variant="primary" isLoading={isSubmitting} className="rounded-xl px-8">Save Changes</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
