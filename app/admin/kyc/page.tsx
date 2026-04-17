"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface UserInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface Attachment {
  fileUrl: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
}

interface KYCRecord {
  _id: string;
  kycReference: string;
  userId: UserInfo;
  documentType: string;
  currentStatus: string;
  attachments: Attachment[];
  createdAt: string;
  documentDetails?: {
    issuedCountry?: string;
    expiryDate?: string;
  };
  verifiedAt?: string;
  metadata?: {
    rejectionReason?: string;
    ipAddress?: string;
  };
  isReuploaded?: boolean;
}

export default function AdminKYCPage() {
  const { apiFetch } = useAuthContext();
  const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [docTypeFilter, setDocTypeFilter] = useState("All");
  const [reuploadFilter, setReuploadFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchKYCRecords = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/admin/kyc");
      if (res.ok) {
        const data = await res.json();
        setKycRecords(data);
      }
    } catch (error) {
      console.error("Failed to fetch KYC records", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKYCRecords();
  }, [apiFetch]);

  const handleUpdateStatus = async (id: string, newStatus: string, reason?: string) => {
    setProcessingId(id);
    try {
      const res = await apiFetch(`/api/admin/kyc/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus, rejectionReason: reason }),
      });

      if (res.ok) {
        toast.success(`KYC status updated to ${newStatus}!`);
        fetchKYCRecords();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to update KYC status.");
      }
    } catch (error) {
      toast.error("An error occurred while updating the status.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRecords = kycRecords.filter((kyc) => {
    const matchesSearch = kyc.kycReference.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          kyc.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || kyc.currentStatus === statusFilter;
    const matchesDocType = docTypeFilter === "All" || kyc.documentType === docTypeFilter;
    const matchesReupload = !reuploadFilter || kyc.isReuploaded;
    return matchesSearch && matchesStatus && matchesDocType && matchesReupload;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">KYC Verification</h1>
          <p className="text-sm text-gray-500">Compact list of identity documents awaiting review.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input 
            type="text" 
            placeholder="Search email/reference..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48"
          />
          <select 
            value={docTypeFilter}
            onChange={(e) => { setDocTypeFilter(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white"
          >
            <option value="All">All Types</option>
            <option value="PAN">PAN</option>
            <option value="Aadhar">Aadhar</option>
            <option value="Signature">Signature</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In-Review">In-Review</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button 
            onClick={() => { setReuploadFilter(!reuploadFilter); setCurrentPage(1); }}
            className={`px-3 py-1.5 text-sm font-bold rounded-lg border transition-all ${reuploadFilter ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-orange-500'}`}
          >
            Re-uploaded Files
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-600 uppercase tracking-widest">Document</th>
              <th className="p-4 text-xs font-bold text-gray-600 uppercase tracking-widest">User</th>
              <th className="p-4 text-xs font-bold text-gray-600 uppercase tracking-widest">Status</th>
              <th className="p-4 text-xs font-bold text-gray-600 uppercase tracking-widest">Date</th>
              <th className="p-4 text-xs font-bold text-gray-600 uppercase tracking-widest text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedRecords.length === 0 ? (
              <tr><td colSpan={5} className="p-12 text-center text-gray-400">No records found.</td></tr>
            ) : (
              paginatedRecords.map((kyc) => (
                <tr key={kyc._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <div className="font-bold text-gray-900 border-l-4 border-blue-500 pl-3">{kyc.documentType}</div>
                       {kyc.isReuploaded && (
                         <span className="bg-orange-100 text-orange-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-orange-200 animate-pulse">
                           Re-uploaded
                         </span>
                       )}
                    </div>
                    <div className="text-[10px] text-gray-500 ml-4 font-mono">{kyc.kycReference}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-gray-900">{kyc.userId?.firstName} {kyc.userId?.lastName}</div>
                    <div className="text-xs text-gray-500">{kyc.userId?.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${kyc.currentStatus === 'Verified' ? 'bg-green-100 text-green-700' :
                        kyc.currentStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                        kyc.currentStatus === 'In-Review' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'}`}>
                      {kyc.currentStatus}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(kyc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <a 
                      href={`/admin/kyc/${kyc._id}`}
                      className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-md transition-colors"
                    >
                      Review
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                className="text-xs py-1 h-8"
              >
                Previous
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className="text-xs py-1 h-8"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}