"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

interface KYC {
  _id: string;
  kycReference: string;
  documentType: string;
  currentStatus: string;
  attachments: { fileUrl: string; fileType: string }[];
}

interface UserInfo {
  _id: string;
  name?: string;
  email: string;
}

interface AccountRequest {
  _id: string;
  userId: UserInfo;
  accountType: string;
  currentStatus: string;
  createdAt: string;
  kycs: KYC[]; // Attached KYCs
}

export default function AdminAccountRequestsPage() {
  const { apiFetch } = useAuthContext();
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleVerify = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const res = await apiFetch(`/api/admin/account-requests/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "approve" }),
      });

      if (res.ok) {
        alert("Account Request Approved successfully!");
        fetchRequests(); // Refresh list
      } else {
        const error = await res.json();
        alert(error.message || "Failed to approve request.");
      }
    } catch (error) {
      alert("An error occurred during verification.");
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Requests</h1>
          <p className="text-sm text-gray-500">Review and verify new account applications and their KYC statuses.</p>
        </div>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white border border-gray-200 rounded-xl">
            No pending account requests.
          </div>
        ) : (
          requests.map((req) => {
            // Check if all attached KYCs are verified AND there is at least one KYC
            const allKycsVerified = req.kycs.length > 0 && req.kycs.every(k => k.currentStatus === 'Verified');
            const isExpanded = expandedId === req._id;

            return (
              <div key={req._id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all">
                {/* Header Row (Always Visible) */}
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(req._id)}
                >
                  <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Applicant</p>
                      <p className="font-medium text-gray-900">{req.userId.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Type</p>
                      <p className="font-medium text-gray-900">{req.accountType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        req.currentStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                        req.currentStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {req.currentStatus.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Applied On</p>
                      <p className="text-sm text-gray-900">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="ml-4 text-gray-400">
                    <svg className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expandable Body */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Attached KYC Documents</h3>
                      
                      {/* Verification Action Button */}
                      {req.currentStatus === 'Pending_KYC' && (
                        <div className="flex items-center gap-3">
                          {!allKycsVerified && (
                            <span className="text-xs text-red-600 font-medium">
                              Requires all KYCs to be Approved
                            </span>
                          )}
                          <Button 
                            variant="primary"
                            onClick={() => handleVerify(req._id)}
                            disabled={!allKycsVerified || processingId === req._id}
                            isLoading={processingId === req._id}
                          >
                            Verify & Approve Account
                          </Button>
                        </div>
                      )}
                    </div>

                    {req.kycs.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No KYC documents found for this user.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {req.kycs.map(kyc => (
                          <div key={kyc._id} className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex justify-between mb-2">
                              <span className="font-medium text-gray-900">{kyc.documentType}</span>
                              <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                                kyc.currentStatus === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {kyc.currentStatus}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">Ref: {kyc.kycReference}</p>
                            
                            <div className="space-y-2">
                              {kyc.attachments.map((doc, idx) => (
                                <a 
                                  key={idx} 
                                  href={doc.fileUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-md"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                  </svg>
                                  View {doc.fileType} Document
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}