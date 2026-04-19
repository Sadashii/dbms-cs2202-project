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
    if (id) fetchKYC();
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
      toast.error("An error occurred during status sync.");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!kyc) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header Protocol */}
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-slate-800 rounded-xl px-4 h-10">
            &larr; Back to Queue
          </Button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">KYC Focus View</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">PROTOCOL: {kyc.documentType} ({kyc.kycReference})</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Forensic Content */}
          <div className="lg:col-span-2 space-y-8">
            {(() => {
              const lastRejection = [...(kyc.statusHistory || [])].reverse().find(h => h.state === 'Rejected');
              if (lastRejection && ['Pending', 'In-Review'].includes(kyc.currentStatus)) {
                return (
                  <div className="bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-900/30 rounded-2xl p-5 flex items-start gap-4 transition-colors">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-xl text-orange-600 dark:text-orange-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-orange-800 dark:text-orange-400 uppercase tracking-widest">Re-upload Conflict Context</h3>
                      <p className="text-xs text-orange-700 dark:text-orange-300/80 mt-1 font-medium">Verify if this packet addresses the previous anomaly:</p>
                      <div className="mt-3 bg-white dark:bg-slate-900 border border-orange-100 dark:border-orange-900/30 p-3 rounded-xl text-xs font-mono text-orange-900 dark:text-orange-200 italic">
                        "{lastRejection.remarks || "Reason omitted by previous auditor."}"
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm transition-colors">
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight border-b dark:border-slate-800 pb-3">Document Metadata</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Identity Principal</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-200">{kyc.userId?.firstName} {kyc.userId?.lastName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">{kyc.userId?.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Temporal Stamp</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-200">{new Date(kyc.createdAt).toLocaleDateString()} @ {new Date(kyc.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Asset Class</p>
                  <p className="text-sm font-black text-blue-600 dark:text-blue-400">{kyc.documentType}</p>
                </div>
                {kyc.documentDetails?.encryptedNumber && kyc.documentDetails.encryptedNumber !== 'N/A' && (
                  <div className="col-span-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border dark:border-slate-800">
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Decrypted Registry Number</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white tracking-[0.3em] font-mono">
                      {(() => { try { return atob(kyc.documentDetails!.encryptedNumber!); } catch { return 'ERR: DECODE_FAILURE'; } })()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm transition-colors">
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight border-b dark:border-slate-800 pb-3">Visual Evidence</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {kyc.attachments.map((doc, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 overflow-hidden group">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{doc.fileType}</p>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline">Full Resolution &rarr;</a>
                    </div>
                    {doc.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <div className="w-full h-60 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden border dark:border-slate-800 transition-all group-hover:scale-[1.02]">
                        <img src={doc.fileUrl} alt={doc.fileType} className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-full h-60 bg-slate-100 dark:bg-slate-900 rounded-xl flex flex-col items-center justify-center text-gray-400 dark:text-slate-700">
                        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">Binary Payload</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Decision Terminal */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-2xl transition-colors sticky top-8">
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight border-b dark:border-slate-800 pb-3">Audit Protocol</h2>
              
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border dark:border-slate-800">
                   <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Current State</p>
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border block text-center transition-all ${
                     kyc.currentStatus === 'Verified' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30' :
                     kyc.currentStatus === 'Rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/30' :
                     'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800/30'
                   }`}>{kyc.currentStatus}</span>
                </div>

                {kyc.currentStatus === 'Verified' ? (
                  <div className="text-center space-y-3 pt-4">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-sm">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Protocol Verified & Locked</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rejecting ? (
                      <div className="space-y-4 animate-fade-in pt-2">
                        <label className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Rejection Forensic Data</label>
                        <textarea
                          placeholder="State exact anomaly for rejection..."
                          className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white h-32 resize-none transition-all"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button variant="ghost" className="flex-1 text-[10px] font-black uppercase rounded-xl dark:text-gray-400" onClick={() => { setRejecting(false); setRejectionReason(""); }}>Abort</Button>
                          <Button variant="primary" className="flex-[2] bg-red-600 hover:bg-red-700 text-[10px] font-black uppercase rounded-xl" onClick={() => handleUpdateStatus('Rejected', rejectionReason)} isLoading={processingId === id}>Confirm Rejection</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Button variant="primary" className="w-full bg-emerald-600 hover:bg-emerald-700 py-7 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/20" onClick={() => handleUpdateStatus('Verified')} isLoading={processingId === id}>Authorize Identity</Button>
                        {kyc.currentStatus === 'Pending' && (
                          <Button variant="outline" className="w-full py-5 text-[10px] font-black uppercase rounded-2xl dark:border-slate-800 dark:text-white" onClick={() => handleUpdateStatus('In-Review')} isLoading={processingId === id}>Assign In-Review</Button>
                        )}
                        <Button variant="outline" className="w-full text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 py-5 text-[10px] font-black uppercase rounded-2xl" onClick={() => setRejecting(true)}>Reject Asset</Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Status History Timeline */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm transition-colors">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Verification Ledger</h3>
              <div className="space-y-6">
                {kyc.statusHistory?.map((historyEvent, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full mt-1.5 transition-colors ${historyEvent.state === 'Verified' ? 'bg-emerald-500' : historyEvent.state === 'Rejected' ? 'bg-red-500' : 'bg-blue-600'}`} />
                      {idx !== kyc.statusHistory.length - 1 && <div className="w-px flex-1 bg-gray-100 dark:bg-slate-800 my-1" />}
                    </div>
                    <div className="pb-2">
                      <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">{historyEvent.state}</p>
                      {historyEvent.remarks && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed italic">"{historyEvent.remarks}"</p>}
                      <p className="text-[9px] text-gray-400 dark:text-gray-600 font-mono mt-1 uppercase">{new Date(historyEvent.updatedAt).toLocaleDateString()} &bull; {new Date(historyEvent.updatedAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}