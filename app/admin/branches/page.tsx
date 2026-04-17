"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

type BranchStatus = 'Active' | 'Maintenance' | 'Temporarily_Closed' | 'Permanently_Closed';

export default function AdminBranchesPage() {
    const { apiFetch, user } = useAuthContext();
    const [branches, setBranches] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUsersLoading, setIsUsersLoading] = useState(false);

    // Filters
    const [selectedBranchId, setSelectedBranchId] = useState<string>("");
    const [roleFilter, setRoleFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Form states for Branch
    const [branchName, setBranchName] = useState("");
    const [branchCode, setBranchCode] = useState("");
    const [branchType, setBranchType] = useState("Main");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zipCode, setZipCode] = useState("");

    // Form states for Assign/Role
    const [assignBranchId, setAssignBranchId] = useState("");
    const [assignRole, setAssignRole] = useState("");

    const fetchBranches = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/admin/branches");
            if (res.ok) {
                const data = await res.json();
                setBranches(data.branches || []);
            }
        } catch (err) {
            console.error("Failed to load branches", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        setIsUsersLoading(true);
        try {
            let url = `/api/admin/users?role=${roleFilter}&branchId=${selectedBranchId}`;
            const res = await apiFetch(url);
            if (res.ok) {
                const data = await res.json();
                setUsers(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to load users", err);
        } finally {
            setIsUsersLoading(false);
        }
    };

    useEffect(() => {
        if (user && ['Admin', 'Manager', 'Employee'].includes(user.role)) {
            fetchBranches();
        }
    }, [user, apiFetch]);

    useEffect(() => {
        if (user) {
            fetchUsers();
        }
    }, [user, roleFilter, selectedBranchId]);

    const handleAddBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await apiFetch("/api/admin/branches", {
                method: "POST",
                body: JSON.stringify({
                    branchName,
                    branchCode,
                    branchType,
                    contactInfo: { email, phone },
                    address: { street, city, state, zipCode }
                })
            });

            if (res.ok) {
                toast.success("Branch network expanded successfully.");
                setIsAddModalOpen(false);
                setBranchName("");
                setBranchCode("");
                fetchBranches();
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to create branch.");
            }
        } catch (err) {
            toast.error("Network error during branch creation.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            const res = await apiFetch(`/api/admin/users/${selectedUser._id}/role`, {
                method: "PATCH",
                body: JSON.stringify({
                    role: assignRole,
                    branchId: assignBranchId || null
                })
            });

            if (res.ok) {
                toast.success("User assignment updated.");
                setIsAssignModalOpen(false);
                fetchUsers();
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to update user.");
            }
        } catch (err) {
            toast.error("Network error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAssignModal = (u: any) => {
        setSelectedUser(u);
        setAssignBranchId(u.branchId || "");
        setAssignRole(u.role);
        setIsAssignModalOpen(true);
    };

    if (!user || !['Admin', 'Manager', 'Employee'].includes(user.role)) {
        return <div className="p-8 text-red-500 font-bold">Unauthorized. Restricted Access.</div>;
    }

    const filteredUsers = users.filter(u => 
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Global Stats for the top bar
    const totalGlobalLoanVolume = branches.reduce((sum, b) => sum + (b.totalLoanVolume || 0), 0);
    const totalGlobalTxVolume = branches.reduce((sum, b) => sum + (b.transactionVolume || 0), 0);

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Operations Dashboard</h1>
                    <p className="text-sm text-gray-500 font-medium">Monitoring the VaultPay Global Network</p>
                </div>
                
                <div className="flex gap-6 items-center">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Portfolio</p>
                        <p className="text-lg font-black text-blue-600">₹{totalGlobalLoanVolume.toLocaleString()}</p>
                    </div>
                    <div className="h-10 w-px bg-gray-100"></div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Network Txs</p>
                        <p className="text-lg font-black text-gray-900">{totalGlobalTxVolume.toLocaleString()}</p>
                    </div>
                    {user.role === 'Admin' && (
                        <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 font-bold px-5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                            Add Branch
                        </Button>
                    )}
                </div>
            </div>

            {/* Top Bar: Branch Performance Stats */}
            <div className="overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex gap-4">
                    <div 
                        onClick={() => setSelectedBranchId("")}
                        className={`min-w-[200px] p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between h-28 ${selectedBranchId === "" ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-[1.02]' : 'bg-white text-gray-900 border-gray-100 hover:border-blue-500'}`}
                    >
                        <p className={`text-[10px] font-bold uppercase ${selectedBranchId === "" ? 'opacity-80' : 'text-gray-400'}`}>Global View</p>
                        <div>
                            <p className="text-lg font-black tracking-tight leading-tight">All Regions</p>
                            <p className={`text-xs mt-1 ${selectedBranchId === "" ? 'opacity-80 text-white' : 'text-blue-500'} font-bold`}>
                                Select to reset filter
                            </p>
                        </div>
                    </div>

                    {branches.map(b => (
                        <div 
                            key={b._id}
                            onClick={() => setSelectedBranchId(b._id)}
                            className={`min-w-[240px] p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between h-28 ${selectedBranchId === b._id ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-[1.02]' : 'bg-white text-gray-900 border-gray-100 hover:border-blue-500 group shadow-sm'}`}
                        >
                            <div className="flex justify-between items-start">
                                <p className={`text-[10px] font-bold uppercase ${selectedBranchId === b._id ? 'opacity-80' : 'text-gray-400'}`}>{b.branchCode}</p>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase ${selectedBranchId === b._id ? 'bg-blue-400 text-white' : 'bg-gray-100 text-gray-500'}`}>{b.branchType}</span>
                            </div>
                            
                            <div>
                                <p className="text-sm font-bold truncate leading-tight mb-1">{b.branchName}</p>
                                <div className="flex justify-between items-end">
                                    <p className={`text-xs font-black ${selectedBranchId === b._id ? 'text-white/90' : 'text-blue-600'}`}>₹{(b.totalLoanVolume || 0).toLocaleString()}</p>
                                    <p className={`text-[10px] font-bold ${selectedBranchId === b._id ? 'text-white/60' : 'text-gray-400'}`}>Txs: {b.transactionVolume || 0}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Section: User Management */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex gap-4 items-center">
                        <h2 className="font-black text-gray-900 tracking-tight">Access Control & Staffing</h2>
                        <div className="flex rounded-xl bg-gray-200/50 p-1">
                            {['', 'Employee', 'Manager', 'Customer'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRoleFilter(r)}
                                    className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${roleFilter === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {r || 'All Entities'}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search identification..."
                                className="w-64 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/10 text-gray-400">
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Principal Identity</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Authority Level</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Affiliation</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Lifecycle</th>
                                <th className="p-5 text-right text-[10px] font-black uppercase tracking-widest">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isUsersLoading ? (
                                 <tr><td colSpan={5} className="p-16 text-center"><div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-bold">No Principals Matching Search Criteria</td></tr>
                            ) : (
                                filteredUsers.map(u => (
                                    <tr key={u._id} className="hover:bg-gray-50/50 group transition-colors">
                                        <td className="p-5">
                                            <div className="font-black text-gray-900 border-l-4 border-transparent group-hover:border-blue-500 pl-3 transition-all">{u.firstName} {u.lastName}</div>
                                            <div className="text-xs text-gray-400 ml-3">{u.email}</div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${u.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : u.role === 'Manager' ? 'bg-blue-50 text-blue-700 border-blue-100' : u.role === 'Employee' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                                {branches.find(b => b._id === u.branchId)?.branchName || 'Remote Core'}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${u.currentStatus === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></span>
                                                <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">{u.currentStatus}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <Button variant="outline" size="sm" className="text-[10px] font-black uppercase py-1.5 h-auto rounded-xl hover:bg-blue-600 hover:text-white transition-all border-gray-200" onClick={() => openAssignModal(u)}>
                                                Provision
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Branch Creation Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => !isSubmitting && setIsAddModalOpen(false)} title="Provision New Node">
                <form onSubmit={handleAddBranch} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Identity Name" value={branchName} onChange={e => setBranchName(e.target.value)} required placeholder="Downtown Headquarters" />
                        <Input label="Registry Code" value={branchCode} onChange={e => setBranchCode(e.target.value.toUpperCase())} required placeholder="HQ-MUM-01" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Architecture Type</label>
                        <select className="w-full border border-gray-300 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium" value={branchType} onChange={e => setBranchType(e.target.value)}>
                            <option value="Main">Main Core Hub</option>
                            <option value="Mini">Mini Node</option>
                            <option value="ATM_Only">Automated Point</option>
                            <option value="Digital">Digital Support Cell</option>
                        </select>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Geolocation Data</h4>
                        <Input label="Primary Access Path" value={street} onChange={e => setStreet(e.target.value)} required placeholder="123 Banking Ave, Suite 500" />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Settlement" value={city} onChange={e => setCity(e.target.value)} required placeholder="Mumbai" />
                            <Input label="Admin Region" value={state} onChange={e => setState(e.target.value)} required placeholder="Maharashtra" />
                        </div>
                        <Input label="Grid Registry" value={zipCode} onChange={e => setZipCode(e.target.value)} required placeholder="400001" />
                    </div>

                    <div className="bg-blue-50/50 p-5 rounded-2xl space-y-4 border border-blue-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Sync Channels</h4>
                        <Input label="Official Gateway" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="hq@vaultpay.app" />
                        <Input label="Critical Hotline" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+91 1800 123 4567" />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting} className="rounded-xl font-bold">Abort</Button>
                        <Button type="submit" variant="primary" isLoading={isSubmitting} className="rounded-xl font-bold px-8">Provision</Button>
                    </div>
                </form>
            </Modal>

            {/* User Assign Modal */}
            <Modal 
                isOpen={isAssignModalOpen} 
                onClose={() => !isSubmitting && setIsAssignModalOpen(false)} 
                title="Principal Override"
                description={`Adjusting authority level and affiliation for ${selectedUser?.firstName} ${selectedUser?.lastName}.`}
            >
                <form onSubmit={handleAssignUser} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Authority Level</label>
                        <select 
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-800 bg-white" 
                            value={assignRole} 
                            onChange={e => setAssignRole(e.target.value)}
                        >
                            <option value="Customer">Standard Principal (Customer)</option>
                            <option value="Employee">Operational Agent (Employee)</option>
                            <option value="Manager">Node Commander (Manager)</option>
                            {user.role === 'Admin' && <option value="Admin">System Core (Admin)</option>}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Branch Affiliation</label>
                        <select 
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-800 bg-white" 
                            value={assignBranchId} 
                            onChange={e => setAssignBranchId(e.target.value)}
                        >
                            <option value="">Detached Source (No Branch)</option>
                            {branches.map(b => (
                                <option key={b._id} value={b._id}>{b.branchName} ({b.branchCode})</option>
                            ))}
                        </select>
                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mt-4">
                            <p className="text-[10px] text-orange-700 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                Synchronization Warning
                            </p>
                            <p className="text-[11px] text-orange-600 font-medium leading-relaxed">
                                Modifying affiliation levels will immediately update access logs. Branch commanders detaching from their node may cause administrative delays.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)} disabled={isSubmitting} className="rounded-xl font-bold">Discard Changes</Button>
                        <Button type="submit" variant="primary" isLoading={isSubmitting} className="rounded-xl font-bold px-8">Save Protocol</Button>
                    </div>
                </form>
            </Modal>

        </div>
    );
}
