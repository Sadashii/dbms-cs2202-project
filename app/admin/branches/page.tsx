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
    const [isLoading, setIsLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [branchName, setBranchName] = useState("");
    const [branchCode, setBranchCode] = useState("");
    const [branchType, setBranchType] = useState("Main");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zipCode, setZipCode] = useState("");

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

    useEffect(() => {
        if (user?.role === "Admin") {
            fetchBranches();
        }
    }, [user, apiFetch]);

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

    const handleToggleStatus = async (branchId: string, currentStatus: BranchStatus) => {
        const nextStatus = currentStatus === 'Active' ? 'Temporarily_Closed' : 'Active';
        if (!confirm(`Are you sure you want to mark this branch as ${nextStatus.replace('_', ' ')}?`)) return;

        try {
            const res = await apiFetch("/api/admin/branches", {
                method: "PATCH",
                body: JSON.stringify({ branchId, currentStatus: nextStatus })
            });

            if (res.ok) {
                toast.success(`Branch marked as ${nextStatus.replace('_', ' ')}`);
                fetchBranches();
            } else {
                toast.error("Failed to update status.");
            }
        } catch (err) {
            toast.error("Error updating branch.");
        }
    };

    if (user?.role !== "Admin") {
        return <div className="p-8 text-red-500 font-bold">Unauthorized. Super Admin access required.</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
                    <p className="text-gray-500">Oversee and expand the VaultPay physical branch network.</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Add New Branch
                </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Branch Details</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Location</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-10 text-center"><div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div></td></tr>
                        ) : branches.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-16 text-center text-gray-500">
                                    <h3 className="font-bold text-gray-800 mb-1">No Branches Found</h3>
                                    <p className="text-sm">Start by adding your headquarters or first regional branch.</p>
                                </td>
                            </tr>
                        ) : (
                            branches.map((branch) => (
                                <tr key={branch._id} className="hover:bg-gray-50/50">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{branch.branchName}</div>
                                        <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
                                            <span className="bg-gray-100 px-1 py-0.5 rounded">{branch.branchCode}</span>
                                            <span>• Type: {branch.branchType}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-gray-900">{branch.address.city}, {branch.address.state}</div>
                                        <div className="text-xs text-gray-500 truncate max-wxs">{branch.address.street} - {branch.address.zipCode}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-gray-900">{branch.contactInfo.phone}</div>
                                        <div className="text-xs text-blue-600 hover:underline">{branch.contactInfo.email}</div>
                                    </td>
                                    <td className="p-4">
                                         <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider
                                            ${branch.currentStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {branch.currentStatus.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button 
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs border text-gray-600 hover:bg-gray-100"
                                            onClick={() => handleToggleStatus(branch._id, branch.currentStatus)}
                                        >
                                            {branch.currentStatus === 'Active' ? 'Close Node' : 'Open Node'}
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Branch Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => !isSubmitting && setIsAddModalOpen(false)} title="Register New Branch Node">
                <form onSubmit={handleAddBranch} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Branch Name" value={branchName} onChange={e => setBranchName(e.target.value)} required placeholder="Downtown Headquarters" />
                        <Input label="Short Code" value={branchCode} onChange={e => setBranchCode(e.target.value.toUpperCase())} required placeholder="HQ-MUM-01" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch Type</label>
                        <select className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-500" value={branchType} onChange={e => setBranchType(e.target.value)}>
                            <option value="Main">Main Hub</option>
                            <option value="Mini">Mini Branch</option>
                            <option value="ATM_Only">ATM Node Only</option>
                            <option value="Digital">Digital / Support Core</option>
                        </select>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Location Information</h4>
                        <Input label="Street Address" value={street} onChange={e => setStreet(e.target.value)} required placeholder="123 Banking Ave, Suite 500" />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="City" value={city} onChange={e => setCity(e.target.value)} required placeholder="Mumbai" />
                            <Input label="State/Province" value={state} onChange={e => setState(e.target.value)} required placeholder="Maharashtra" />
                        </div>
                        <Input label="Postal Code" value={zipCode} onChange={e => setZipCode(e.target.value)} required placeholder="400001" />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Contact Details</h4>
                        <Input label="Official Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="mumhq@vaultpay.app" />
                        <Input label="Hotline Phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+91 1800 123 4567" />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="primary" isLoading={isSubmitting}>Provision Branch</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
