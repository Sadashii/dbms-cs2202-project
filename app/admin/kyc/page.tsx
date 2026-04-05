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
}

export default function AdminKYCPage() {
  const { apiFetch } = useAuthContext();
  const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // State for rejecting a document
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
        setRejectingId(null);
        setRejectionReason("");
        fetchKYCRecords(); // Refresh the list
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredRecords = kycRecords.filter((kyc) => {
    const matchesSearch = kyc.kycReference.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          kyc.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || kyc.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Verification Queue</h1>
          <p className="text-sm text-gray-500">Review user identity documents and update verification statuses.</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="Search email or reference..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 w-full min-w-[200px]"
          />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In-Review">In-Review</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white border border-gray-200 rounded-xl shadow-sm">
            No matching KYC records found.
          </div>
        ) : (
          filteredRecords.map((kyc) => (
            <div key={kyc._id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
              
              {/* Left Column: Details */}
              <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{kyc.documentType}</h3>
                    <p className="text-sm font-mono text-gray-500 mb-1">Ref: {kyc.kycReference}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      kyc.currentStatus === 'Verified' ? 'bg-green-50 text-green-700 border-green-200' :
                      kyc.currentStatus === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                      kyc.currentStatus === 'In-Review' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {kyc.currentStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">User Details</p>
                    <p className="font-medium text-gray-900">{kyc.userId?.firstName || kyc.userId?.lastName ? `${kyc.userId.firstName || ''} ${kyc.userId.lastName || ''}`.trim() : 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{kyc.userId?.email || 'Unknown User'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">Submitted On</p>
                    <p className="font-medium text-gray-900">{new Date(kyc.createdAt).toLocaleDateString()}</p>
                  </div>
                  {(kyc.documentDetails?.issuedCountry || kyc.documentDetails?.expiryDate) && (
                    <div>
                      <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">Document Info</p>
                      {kyc.documentDetails.issuedCountry && <p className="font-medium text-gray-900">{kyc.documentDetails.issuedCountry}</p>}
                      {kyc.documentDetails.expiryDate && <p className="text-xs text-gray-500">Exp: {new Date(kyc.documentDetails.expiryDate).toLocaleDateString()}</p>}
                    </div>
                  )}
                  {(kyc.verifiedAt || kyc.metadata?.ipAddress) && (
                    <div>
                      <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">Additional Info</p>
                      {kyc.verifiedAt && <p className="font-medium text-green-700">Verified: {new Date(kyc.verifiedAt).toLocaleDateString()}</p>}
                      {kyc.metadata?.ipAddress && <p className="text-xs text-gray-500">IP: {kyc.metadata.ipAddress}</p>}
                    </div>
                  )}
                </div>

                {kyc.currentStatus === 'Rejected' && kyc.metadata?.rejectionReason && (
                   <div className="bg-red-50 p-3 rounded-md border border-red-100 text-sm text-red-800 mb-4">
                     <span className="font-semibold">Rejection Reason:</span> {kyc.metadata.rejectionReason}
                   </div>
                )}

                <div>
                  <p className="text-gray-500 uppercase tracking-wider text-xs mb-2">Attachments</p>
                  <div className="flex flex-wrap gap-2">
                    {kyc.attachments.map((doc, idx) => (
                      <a 
                        key={idx} 
                        href={doc.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors border border-blue-100"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {doc.fileType} Document
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="p-6 w-full md:w-48 bg-gray-50 flex flex-col justify-center border-l border-gray-200">
                <a 
                  href={`/admin/kyc/${kyc._id}`}
                  className="w-full text-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Review Document
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}