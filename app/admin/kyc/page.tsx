"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

interface UserInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  customerId?: string;
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

interface KYCReviewGroup {
  userId: string;
  name: string;
  email: string;
  customerId?: string;
  latestActivityAt: string;
  highestPriorityStatus: string;
  hasReuploaded: boolean;
  documents: Array<{
    id: string;
    type: string;
    status: string;
    reference: string;
  }>;
  stats: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  };
}

const STATUS_PRIORITY: Record<string, number> = {
  Pending: 1,
  "In-Review": 2,
  Rejected: 3,
  Verified: 4,
  Expired: 5,
};

export default function AdminKYCPage() {
  const { apiFetch } = useAuthContext();
  const router = useRouter();
  const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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

  const groupedRecords = useMemo(() => {
    const grouped = new Map<string, KYCReviewGroup>();

    for (const kyc of kycRecords) {
      const groupKey = kyc.userId?._id || kyc._id;
      const existingGroup = grouped.get(groupKey);
      const fullName = `${kyc.userId?.firstName || ""} ${kyc.userId?.lastName || ""}`.trim() || "Unknown Customer";

      const currentTimestamp = new Date(kyc.createdAt).getTime();
      const existingTimestamp = existingGroup ? new Date(existingGroup.latestActivityAt).getTime() : 0;
      const currentPriority = STATUS_PRIORITY[kyc.currentStatus] ?? 99;
      const existingPriority = existingGroup ? STATUS_PRIORITY[existingGroup.highestPriorityStatus] ?? 99 : 99;

      if (!existingGroup) {
        grouped.set(groupKey, {
          userId: groupKey,
          name: fullName,
          email: kyc.userId?.email || "No email",
          customerId: kyc.userId?.customerId,
          latestActivityAt: kyc.createdAt,
          highestPriorityStatus: kyc.currentStatus,
          hasReuploaded: Boolean(kyc.isReuploaded),
          documents: [
            {
              id: kyc._id,
              type: kyc.documentType,
              status: kyc.currentStatus,
              reference: kyc.kycReference,
            },
          ],
          stats: {
            total: 1,
            pending: ["Pending", "In-Review"].includes(kyc.currentStatus) ? 1 : 0,
            verified: kyc.currentStatus === "Verified" ? 1 : 0,
            rejected: kyc.currentStatus === "Rejected" ? 1 : 0,
          },
        });
        continue;
      }

      existingGroup.documents.push({
        id: kyc._id,
        type: kyc.documentType,
        status: kyc.currentStatus,
        reference: kyc.kycReference,
      });
      existingGroup.stats.total += 1;
      existingGroup.stats.pending += ["Pending", "In-Review"].includes(kyc.currentStatus) ? 1 : 0;
      existingGroup.stats.verified += kyc.currentStatus === "Verified" ? 1 : 0;
      existingGroup.stats.rejected += kyc.currentStatus === "Rejected" ? 1 : 0;
      existingGroup.hasReuploaded = existingGroup.hasReuploaded || Boolean(kyc.isReuploaded);

      if (currentPriority < existingPriority || (currentPriority === existingPriority && currentTimestamp > existingTimestamp)) {
        existingGroup.highestPriorityStatus = kyc.currentStatus;
      }

      if (currentTimestamp > existingTimestamp) {
        existingGroup.latestActivityAt = kyc.createdAt;
      }
    }

    return Array.from(grouped.values())
      .map((group) => ({
        ...group,
        documents: group.documents.sort((a, b) => {
          const statusDiff = (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99);
          if (statusDiff !== 0) {
            return statusDiff;
          }

          return a.type.localeCompare(b.type);
        }),
      }))
      .sort((a, b) => {
        const statusDiff = (STATUS_PRIORITY[a.highestPriorityStatus] ?? 99) - (STATUS_PRIORITY[b.highestPriorityStatus] ?? 99);
        if (statusDiff !== 0) {
          return statusDiff;
        }

        return new Date(b.latestActivityAt).getTime() - new Date(a.latestActivityAt).getTime();
      });
  }, [kycRecords]);

  const filteredRecords = groupedRecords.filter((group) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      group.name.toLowerCase().includes(query) ||
      group.email.toLowerCase().includes(query) ||
      group.customerId?.toLowerCase().includes(query) ||
      group.documents.some(
        (document) =>
          document.reference.toLowerCase().includes(query) ||
          document.type.toLowerCase().includes(query)
      );
    const matchesStatus =
      statusFilter === "All" || group.documents.some((document) => document.status === statusFilter);
    const matchesDocType =
      docTypeFilter === "All" || group.documents.some((document) => document.type === docTypeFilter);
    const matchesReupload = !reuploadFilter || group.hasReuploaded;
    return matchesSearch && matchesStatus && matchesDocType && matchesReupload;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">KYC Verification</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Registry of identity protocols awaiting manual audit.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <input 
              type="text" 
              placeholder="Search name, email, customer ID..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48 transition-all"
            />
            
            <div className="relative">
              <select 
                value={docTypeFilter}
                onChange={(e) => { setDocTypeFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2 pr-10 text-xs font-black uppercase text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="All" className="dark:bg-slate-900">All Types</option>
                <option value="PAN" className="dark:bg-slate-900">PAN</option>
                <option value="Aadhar" className="dark:bg-slate-900">Aadhar</option>
                <option value="Signature" className="dark:bg-slate-900">Signature</option>
              </select>
            </div>

            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2 pr-10 text-xs font-black uppercase text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="All" className="dark:bg-slate-900">All Statuses</option>
                <option value="Pending" className="dark:bg-slate-900">Pending</option>
                <option value="In-Review" className="dark:bg-slate-900">In-Review</option>
                <option value="Verified" className="dark:bg-slate-900">Verified</option>
                <option value="Rejected" className="dark:bg-slate-900">Rejected</option>
              </select>
            </div>

            <button 
              onClick={() => { setReuploadFilter(!reuploadFilter); setCurrentPage(1); }}
              className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl border transition-all ${reuploadFilter ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-400 hover:border-orange-500'}`}
            >
              Re-uploaded
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden transition-colors">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                <tr>
                  <th className="p-6 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Customer</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Submitted Documents</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Review State</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Timestamp</th>
                  <th className="p-6 text-right text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 transition-colors">
                {paginatedRecords.length === 0 ? (
                  <tr><td colSpan={5} className="p-20 text-center text-gray-300 dark:text-slate-700 font-black italic uppercase">No records found matching filter</td></tr>
                ) : (
                  paginatedRecords.map((group) => (
                    <tr key={group.userId} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 group transition-all">
                      <td className="p-6">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/kyc/${group.userId}`)}
                          className="text-left group/name"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-base font-black text-gray-900 transition-colors group-hover/name:text-blue-600 dark:text-white dark:group-hover/name:text-blue-400">
                              {group.name}
                            </div>
                            {group.hasReuploaded && (
                              <span className="rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[9px] font-black uppercase text-orange-600 dark:border-orange-800/30 dark:bg-orange-900/20 dark:text-orange-400">
                                Re-uploaded
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 font-mono">{group.email}</div>
                          {group.customerId && (
                            <div className="mt-1 text-[10px] text-blue-600 dark:text-blue-400 font-mono tracking-[0.2em]">
                              {group.customerId}
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-wrap gap-2">
                          {group.documents.map((document) => (
                            <span
                              key={document.id}
                              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-black uppercase text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                            >
                              {document.type}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                          <span>{group.stats.total} total</span>
                          <span>{group.stats.pending} pending</span>
                          <span>{group.stats.verified} verified</span>
                          <span>{group.stats.rejected} rejected</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border transition-all
                          ${group.highestPriorityStatus === 'Verified' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30' :
                            group.highestPriorityStatus === 'Rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/30' :
                            group.highestPriorityStatus === 'In-Review' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800/30' :
                            'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800/30'}`}>
                          {group.highestPriorityStatus}
                        </span>
                      </td>
                      <td className="p-6 text-xs font-medium text-gray-500 dark:text-gray-400">
                        {new Date(group.latestActivityAt).toLocaleDateString()}
                      </td>
                      <td className="p-6 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => router.push(`/admin/kyc/${group.userId}`)}
                          className="text-[10px] font-black uppercase h-8 rounded-xl dark:border-slate-800 dark:text-white dark:hover:bg-slate-800 transition-all"
                        >
                          Open Record
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/20 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Protocol Batch {currentPage} of {totalPages}</span>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1}
                  className="rounded-xl font-black text-[10px] uppercase h-9 px-6 dark:border-slate-800 dark:text-gray-400"
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                  disabled={currentPage === totalPages}
                  className="rounded-xl font-black text-[10px] uppercase h-9 px-6 dark:border-slate-800 dark:text-gray-400"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
