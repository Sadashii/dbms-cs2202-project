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
  
  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Pagination & Filtering
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 font-bold"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Protocol Entry Queue</h1>
          <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">Pending Account Verification Protocols</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search Principal..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="border-2 border-gray-100 rounded-xl px-4 py-2 text-xs font-bold w-64 shadow-sm"
          />
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="border-2 border-gray-100 rounded-xl px-4 py-2 text-xs font-black uppercase shadow-sm"
          >
            <option value="All">All Protocols</option>
            <option value="Pending_KYC">Pending KYC</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-100 rounded-3xl shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Principal</th>
              <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset Details</th>
              <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">KYC Node Progress</th>
              <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lifecycle</th>
              <th className="p-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Override</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedRequests.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center text-gray-300 font-black italic uppercase">No Matching Protocols</td></tr>
            ) : (
              paginatedRequests.map((req) => {
                const requiredDocs = ['PAN', 'Aadhar', 'Signature'];
                const verifiedDocsCount = (req.kycs || []).filter(k => requiredDocs.includes(k.documentType) && k.currentStatus === 'Verified').length;
                const totalRequired = requiredDocs.length;
                const progressPercent = (verifiedDocsCount / totalRequired) * 100;
                const isReady = verifiedDocsCount === totalRequired;

                return (
                  <tr key={req._id} className="hover:bg-gray-50/50 group transition-all">
                    <td className="p-5">
                      <div className="font-black text-gray-900 border-l-4 border-transparent group-hover:border-blue-500 pl-4 transition-all">
                        {req.userId?.firstName} {req.userId?.lastName}
                      </div>
                      <div className="text-[11px] text-gray-400 pl-4">{req.userId?.email}</div>
                    </td>
                    <td className="p-5">
                      <div className="text-xs font-black text-gray-700">{req.accountType}</div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase mt-1">REF: {req._id.slice(-8)}</div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${isReady ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] font-black text-gray-500">{verifiedDocsCount}/{totalRequired}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase border-2
                        ${req.currentStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          req.currentStatus === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                          'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                        {req.currentStatus.replace('_', ' ')}
                      </span>
                      {req.currentStatus === 'Rejected' && req.metadata?.rejectionReason && (
                        <div className="text-[9px] text-red-400 truncate max-w-[120px] mt-1 font-bold">{req.metadata.rejectionReason}</div>
                      )}
                    </td>
                    <td className="p-5 text-right space-x-2">
                       {req.currentStatus === 'Pending_KYC' && (
                         <>
                           <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openRejectModal(req._id)}
                            disabled={processingId === req._id}
                            className="text-[10px] font-black uppercase text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl"
                          >
                            Reject
                          </Button>
                          <Button 
                            variant="primary"
                            onClick={() => handleApprove(req._id)}
                            disabled={!isReady || processingId === req._id}
                            isLoading={processingId === req._id}
                            className={`text-[10px] font-black uppercase py-1.5 h-auto rounded-xl px-4 ${!isReady ? 'opacity-30' : 'shadow-lg shadow-blue-500/20'}`}
                          >
                            Approve
                          </Button>
                         </>
                       )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/20 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Batch {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo(0, 0); }} disabled={currentPage === 1} className="rounded-xl font-black text-[10px] uppercase h-9">Back</Button>
              <Button variant="ghost" size="sm" onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo(0, 0); }} disabled={currentPage === totalPages} className="rounded-xl font-black text-[10px] uppercase h-9">Forward</Button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      <Modal 
        isOpen={isRejectModalOpen} 
        onClose={() => !processingId && setIsRejectModalOpen(false)} 
        title="Override: Reject Protocol"
        description="Verify reasoning before permanently rejecting this entry protocol. The principal will be notified of the failure."
      >
        <form onSubmit={handleReject} className="space-y-6">
          <Input 
            label="Rejection Context (Reason)" 
            value={rejectionReason} 
            onChange={e => setRejectionReason(e.target.value)} 
            placeholder="Identity documents do not match provided records..." 
            required
          />
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
            <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              Critical Signal
            </p>
            <p className="text-[11px] text-red-600 font-medium leading-relaxed">
              Rejecting this protocol halts account creation. The entry principal will need to re-submit or fix the reported anomalies.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsRejectModalOpen(false)} disabled={processingId === rejectingRequestId} className="rounded-xl font-black uppercase text-[10px]">Withdraw Action</Button>
            <Button type="submit" variant="primary" isLoading={processingId === rejectingRequestId} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-[10px] px-8">Confirm Rejection</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}