"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

interface StatusHistoryEvent {
  state: string;
  remarks?: string;
  updatedAt: string;
}

interface KYCRecord {
  _id: string;
  kycReference: string;
  userId: UserInfo;
  documentType: string;
  documentDetails?: {
    issuedCountry?: string;
    expiryDate?: string;
    encryptedNumber?: string;
  };
  currentStatus: string;
  attachments: Attachment[];
  statusHistory: StatusHistoryEvent[];
  createdAt: string;
  metadata?: {
    rejectionReason?: string;
  };
}

export default function FocusedKYCPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { apiFetch } = useAuthContext();
  
  const [kyc, setKyc] = useState<KYCRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchKYC = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/admin/kyc/${id}`);
      if (res.ok) {
        const data = await res.json();
        setKyc(data);
      } else {
        router.push("/admin/kyc");
      }
    } catch (error) {
      console.error("Failed to fetch KYC", error);
      router.push("/admin/kyc");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchKYC();
    }
  }, [id, apiFetch]);

  const handleUpdateStatus = async (newStatus: string, reason?: string) => {
    setProcessingId(id);
    try {
      const res = await apiFetch(`/api/admin/kyc/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus, rejectionReason: reason }),
      });

      if (res.ok) {
        toast.success(`KYC status updated to ${newStatus}!`);
        setRejecting(false);
        setRejectionReason("");
        fetchKYC();
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

  if (!kyc) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 border border-gray-200">
          &larr; Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Focus View</h1>
          <p className="text-sm text-gray-500">Detailed review of {kyc.documentType} ({kyc.kycReference})</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Details & Attachments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Document Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">User Email</p>
                <p className="font-medium text-gray-900">{kyc.userId?.firstName || kyc.userId?.lastName ? `${kyc.userId.firstName || ''} ${kyc.userId.lastName || ''}`.trim() : 'Unknown'} ({kyc.userId?.email || 'Unknown'})</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">Submitted On</p>
                <p className="font-medium text-gray-900">{new Date(kyc.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">Document Type</p>
                <p className="font-medium text-gray-900">{kyc.documentType}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">Reference</p>
                <p className="font-medium text-gray-900">{kyc.kycReference}</p>
              </div>
              {kyc.documentDetails?.issuedCountry && (
                <div>
                  <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">Issued Country</p>
                  <p className="font-medium text-gray-900">{kyc.documentDetails.issuedCountry}</p>
                </div>
              )}
              {kyc.documentDetails?.expiryDate && (
                <div>
                  <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">Expiry Date</p>
                  <p className="font-medium text-gray-900">{new Date(kyc.documentDetails.expiryDate).toLocaleDateString()}</p>
                </div>
              )}
              {kyc.documentDetails?.encryptedNumber && (
                <div className="col-span-2">
                  <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">Decrypted ID Number</p>
                  <p className="font-medium text-gray-900 tracking-widest font-mono bg-blue-50 px-2 py-1 inline-block rounded">
                    {(() => {
                      try {
                        return atob(kyc.documentDetails.encryptedNumber);
                      } catch {
                        return 'Cannot decode number';
                      }
                    })()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Attachments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kyc.attachments.map((doc, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold">{doc.fileType} Document</p>
                    <a 
                      href={doc.fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                    >
                      Open in new tab
                    </a>
                  </div>
                  {/* Since file might be image or PDF, try embedding if it looks like an image */}
                  {(doc.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
                    <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                      <img src={doc.fileUrl} alt={doc.fileType} className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gray-50 rounded flex items-center justify-center text-gray-400">
                      <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-xs">Document format not previewable</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Status History</h2>
            <div className="space-y-4">
              {kyc.statusHistory && kyc.statusHistory.length > 0 ? (
                kyc.statusHistory.map((historyEvent, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-blue-600 rounded-full mt-1.5" />
                      {idx !== kyc.statusHistory.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-gray-900">{historyEvent.state}</p>
                      {historyEvent.remarks && <p className="text-xs text-gray-600 mt-1">{historyEvent.remarks}</p>}
                      <p className="text-xs text-gray-400 mt-1">{new Date(historyEvent.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No history available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Actions */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative">
            {kyc.currentStatus === 'Verified' ? (
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Document Verified</h3>
                <p className="text-sm text-gray-500 mt-1">This KYC document has already been verified and locked.</p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Actions</h2>
                <div className="space-y-3">
                  <div className="mb-4">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Current Status</span>
                    <div className={`mt-1 inline-flex w-full items-center justify-center px-4 py-2 rounded-md font-medium text-sm border ${
                      kyc.currentStatus === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                      kyc.currentStatus === 'In-Review' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {kyc.currentStatus}
                    </div>
                  </div>

                  {rejecting ? (
                    <div className="space-y-3 pt-2 animate-fade-in">
                      <label className="text-xs font-semibold text-red-600 uppercase">Reason for Rejection</label>
                      <textarea
                        placeholder="Please provide details..."
                        className="w-full text-sm border border-gray-300 rounded-md p-3 outline-none focus:border-red-500"
                        rows={4}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          className="flex-1 text-sm bg-gray-100 hover:bg-gray-200" 
                          onClick={() => { setRejecting(false); setRejectionReason(""); }}
                          disabled={processingId === id}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="primary" 
                          className="flex-1 bg-red-600 hover:bg-red-700 text-sm"
                          onClick={() => handleUpdateStatus('Rejected', rejectionReason)}
                          isLoading={processingId === id}
                        >
                          Submit Rejection
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button 
                        variant="primary" 
                        className="w-full bg-green-600 hover:bg-green-700 mb-2 py-6 text-base shadow-sm"
                        onClick={() => handleUpdateStatus('Verified')}
                        disabled={processingId !== null}
                        isLoading={processingId === id}
                      >
                        Approve & Verify
                      </Button>
                      
                      {kyc.currentStatus === 'Pending' && (
                        <Button 
                          variant="outline" 
                          className="w-full py-5"
                          onClick={() => handleUpdateStatus('In-Review')}
                          disabled={processingId !== null}
                        >
                          Mark as In-Review
                        </Button>
                      )}

                      <Button 
                        variant="outline" 
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 py-5"
                        onClick={() => setRejecting(true)}
                        disabled={kyc.currentStatus === 'Rejected' || processingId !== null}
                      >
                        Reject Document
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
