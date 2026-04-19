"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface KYC {
  _id: string;
  kycReference: string;
  documentType: string;
  currentStatus: string;
  attachments: { fileUrl: string; fileType: string }[];
  documentDetails?: {
    issuedCountry?: string;
    expiryDate?: string;
  };
}

interface UserInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface AccountRequest {
  _id: string;
  userId: UserInfo;
  accountType: string;
  currentStatus: string;
  createdAt: string;
  metadata?: {
    ipAddress?: string;
    rejectionReason?: string;
  };
  kycs: KYC[];
}

export default function AdminAccountRequestsPage() {
  const { apiFetch } = useAuthContext();
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/admin/account-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Failed to fetch account requests", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [apiFetch]);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const res = await apiFetch(`/api/admin/account-requests/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "approve" }),
      });

      if (res.ok) {
        toast.success("Account Approved successfully!");
        fetchRequests();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to approve request.");
      }
    } catch (error) {
      toast.error("An error occurred during verification.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequestId) return;
    setProcessingId(rejectingRequestId);
    try {
      const res = await apiFetch(`/api/admin/account-requests/${rejectingRequestId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "reject", reason: rejectionReason }),
      });

      if (res.ok) {
        toast.success("Account Request Rejected.");
        setIsRejectModalOpen(false);
        setRejectionReason("");
        fetchRequests();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to reject.");
      }
    } catch (error) {
      toast.error("Network error.");
    } finally {
      setProcessingId(null);
      setRejectingRequestId(null);
    }
  };

  const openRejectModal = (id: string) => {
    setRejectingRequestId(id);
    setIsRejectModalOpen(true);
  };

  const filteredRequests = requests.filter((req) => {
    const name = `${req.userId?.firstName || ''} ${req.userId?.lastName || ''}`.toLowerCase();
    const email = (req.userId?.email || "").toLowerCase();
    const matchesSearch = email.includes(searchQuery.toLowerCase()) || 
                          (req.accountType || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          name.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || req.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-950 transition-colors duration-500 pb-12">
      <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Protocol Entry Queue</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-bold tracking-widest uppercase mt-1">Verification Stream</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Search Principal..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-2xl px-5 py-3 text-xs font-bold w-full sm:w-72 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none w-full border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-2xl px-5 py-3 pr-12 text-xs font-black uppercase shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="All" className="dark:bg-slate-900">All Protocols</option>
                <option value="Pending_KYC" className="dark:bg-slate-900">Pending KYC</option>
                <option value="Approved" className="dark:bg-slate-900">Approved</option>
                <option value="Rejected" className="dark:bg-slate-900">Rejected</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px] border-collapse">
              <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                <tr>
                  <th className="p-6 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Entry Principal</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Asset Details</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">KYC Node Progress</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Lifecycle</th>
                  <th className="p-6 text-right text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 transition-colors">
                {paginatedRequests.length === 0 ? (
                  <tr><td colSpan={5} className="p-20 text-center text-gray-300 dark:text-slate-700 font-black italic uppercase">No Matching Protocols</td></tr>
                ) : (
                  paginatedRequests.map((req) => {
                    const requiredDocs = ['PAN', 'Aadhar', 'Signature'];
                    const verifiedDocsCount = (req.kycs || []).filter(k => requiredDocs.includes(k.documentType) && k.currentStatus === 'Verified').length;
                    const totalRequired = requiredDocs.length;
                    const progressPercent = (verifiedDocsCount / totalRequired) * 100;
                    const isReady = verifiedDocsCount === totalRequired;

                    return (
                      <tr key={req._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 group transition-all">
                        <td className="p-6">
                          <div className="font-black text-gray-900 dark:text-white text-base group-hover:text-blue-500 transition-colors">
                            {req.userId?.firstName} {req.userId?.lastName}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{req.userId?.email}</div>
                        </td>
                        <td className="p-6">
                          <div className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">{req.accountType}</div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-1">REF: {req._id.slice(-8)}</div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-2 w-24 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-700 ease-out ${isReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-600'}`} 
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400">{verifiedDocsCount}/{totalRequired}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all
                            ${req.currentStatus === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30' :
                              req.currentStatus === 'Rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/30' :
                              'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800/30'}`}>
                            {req.currentStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-6 text-right space-x-2">
                           {req.currentStatus === 'Pending_KYC' && (
                             <div className="flex justify-end gap-3">
                               <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => openRejectModal(req._id)}
                                disabled={processingId === req._id}
                                className="text-[10px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                              >
                                Reject
                              </Button>
                              <Button 
                                variant="primary"
                                onClick={() => handleApprove(req._id)}
                                disabled={!isReady || processingId === req._id}
                                isLoading={processingId === req._id}
                                className={`text-[10px] font-black uppercase h-9 rounded-xl px-6 ${!isReady ? 'opacity-20 grayscale' : 'shadow-xl shadow-blue-600/20 hover:-translate-y-0.5'}`}
                              >
                                Approve
                              </Button>
                             </div>
                           )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-8 border-t border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/20 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Protocol Batch {currentPage} of {totalPages}</span>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo(0, 0); }} disabled={currentPage === 1} className="rounded-xl font-black text-[10px] uppercase h-10 px-6 dark:border-slate-800 dark:text-gray-400">Previous</Button>
                <Button variant="outline" size="sm" onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo(0, 0); }} disabled={currentPage === totalPages} className="rounded-xl font-black text-[10px] uppercase h-10 px-6 dark:border-slate-800 dark:text-gray-400">Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      <Modal 
        isOpen={isRejectModalOpen} 
        onClose={() => !processingId && setIsRejectModalOpen(false)} 
        title="Override: Reject Protocol"
      >
        <form onSubmit={handleReject} className="space-y-6">
          <Input 
            label="Rejection Context (Reason)" 
            value={rejectionReason} 
            onChange={e => setRejectionReason(e.target.value)} 
            placeholder="Document mismatch..." 
            required
          />
          <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-3xl border border-red-100 dark:border-red-900/20">
            <p className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest mb-1">Critical Signal</p>
            <p className="text-xs text-red-600 dark:text-red-300 font-medium leading-relaxed">
              Rejecting this protocol halts account creation. The entry principal will need to re-submit records.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsRejectModalOpen(false)} className="rounded-xl font-black uppercase text-[10px] dark:text-gray-400">Withdraw</Button>
            <Button type="submit" variant="primary" className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-[10px] px-8">Confirm Rejection</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}