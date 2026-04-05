"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditLog {
  _id: string;
  logReference: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
  userRole: string;
  actionType: string;
  category: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  resource: string;
  resourceId?: string;
  description: string;
  payload: {
    previousState?: string;
    newState?: string;
    diff?: string[];
  };
  metadata: {
    ipAddress: string;
    userAgent: string;
    deviceId?: string;
    geoPoint?: string;
    sessionId?: string;
  };
  currentStatus: "Success" | "Failure" | "Blocked" | "Flagged";
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AuditLogsDashboard() {
  const { user, apiFetch, isLoading: authLoading, isLoggedIn } = useAuthContext();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters State
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("All");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/auth/login");
    if (!authLoading && user && !["Admin", "Manager"].includes(user.role)) {
      router.push("/my");
      toast.error("Unauthorized access to audit logs.");
    }
  }, [authLoading, isLoggedIn, user, router]);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
        ...(severity !== "All" && { severity }),
        ...(category !== "All" && { category }),
        ...(status !== "All" && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const res = await apiFetch(`/api/admin/audit?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to fetch audit logs");
      }
    } catch (error) {
      console.error("Audit log fetch error:", error);
      toast.error("Network error while fetching logs");
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, page, search, severity, category, status, startDate, endDate]);

  useEffect(() => {
    if (user && ["Admin", "Manager"].includes(user.role)) {
      fetchLogs();
    }
  }, [fetchLogs, user]);

  const resetFilters = () => {
    setSearch("");
    setSeverity("All");
    setCategory("All");
    setStatus("All");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const exportToCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Reference", "Timestamp", "User", "Role", "Action", "Category", "Severity", "Status", "Description"];
    const rows = logs.map(l => [
      l.logReference,
      new Date(l.createdAt).toLocaleString(),
      l.userId?.email || "Unknown",
      l.userRole,
      l.actionType,
      l.category,
      l.severity,
      l.currentStatus,
      l.description
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `vaultpay_audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Helpers ───

  const getSeverityColor = (s: string) => {
    switch (s) {
      case "Critical": return "bg-red-100 text-red-700 border-red-200";
      case "High": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Medium": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-blue-50 text-blue-700 border-blue-100";
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "Success": return "bg-green-100 text-green-700";
      case "Failure": return "bg-red-100 text-red-700";
      case "Blocked": return "bg-slate-800 text-white";
      case "Flagged": return "bg-amber-100 text-amber-700 animate-pulse";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (!user || !["Admin", "Manager"].includes(user.role)) return null;

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 animate-fade-in pb-20">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">System Audit Vault</h1>
          <p className="text-slate-500 font-medium text-sm">Real-time forensic ledger of all sensitive application actions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToCSV}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export Ledger
          </button>
          <button 
            onClick={fetchLogs}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
             <input
              type="text"
              placeholder="Search by ID, Description, or Resource..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <select className="px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="All">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
          <select className="px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="Security">Security</option>
            <option value="Financial">Financial</option>
            <option value="Operational">Operational</option>
            <option value="Administrative">Administrative</option>
          </select>
          <select className="px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Failure">Failure</option>
            <option value="Flagged">Flagged</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-50 pt-4 mt-4">
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From</span>
                <input type="date" className="bg-transparent text-xs font-bold outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To</span>
                <input type="date" className="bg-transparent text-xs font-bold outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <button onClick={resetFilters} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest ml-2">Reset All</button>
           </div>
           {pagination && (
              <div className="flex items-center gap-2">
                 <span className="text-xs text-slate-400 font-bold mr-2">{pagination.total} ENTRIES</span>
                 <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                 </button>
                 <span className="text-sm font-bold text-slate-700 min-w-[3rem] text-center">{page} / {pagination.totalPages}</span>
                 <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                 </button>
              </div>
           )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="py-40 flex flex-col items-center justify-center space-y-4">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
             <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Analyzing Audit Logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center space-y-4">
             <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <p className="text-slate-900 font-bold">No logs found matching your criteria</p>
             <button onClick={resetFilters} className="text-blue-600 font-bold text-sm hover:underline">Clear all filters</button>
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-100">
               <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User / Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sev</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Details</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {logs.map((log) => (
                 <tr key={log._id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <td className="px-6 py-4">
                       <p className="text-slate-900 font-bold">{new Date(log.createdAt).toLocaleDateString()}</p>
                       <p className="text-[10px] text-slate-400 font-bold">{new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}</p>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-slate-900 font-bold">{log.userId?.email || 'System'}</p>
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{log.userRole}</span>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-slate-900 font-bold">{log.actionType}</p>
                       <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">{log.description}</p>
                    </td>
                    <td className="px-6 py-4">
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{log.category}</span>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${getStatusBadge(log.currentStatus)}`}>
                          {log.currentStatus}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="inline-block p-1.5 rounded-lg border border-slate-100 group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
                          <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                       </span>
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Details Side Drawer ── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
           <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-slide-left overflow-y-auto">
              
              <div className="sticky top-0 z-10 px-8 py-6 bg-white/80 backdrop-blur border-b border-slate-100 flex items-center justify-between">
                 <div>
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1 block">LOG REFERENCE</span>
                    <h2 className="text-2xl font-black text-slate-900">{selectedLog.logReference}</h2>
                 </div>
                 <button onClick={() => setSelectedLog(null)} className="p-2 border border-slate-100 rounded-full hover:bg-slate-50 transition-all">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="p-8 space-y-10">
                 
                 {/* Basic Forensic Data */}
                 <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Network Identity</label>
                       <p className="text-sm font-black text-slate-900">{selectedLog.metadata.ipAddress}</p>
                       <p className="text-xs text-slate-500 font-medium">{selectedLog.metadata.geoPoint || "Unknown Location"}</p>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Full Status</label>
                       <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase inline-block ${getStatusBadge(selectedLog.currentStatus)}`}>
                         {selectedLog.currentStatus}
                       </span>
                    </div>
                    <div className="col-span-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fingerprint (User Agent)</label>
                       <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedLog.metadata.userAgent}</p>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Resource & ID</label>
                       <p className="text-sm font-black text-slate-900">{selectedLog.resource}</p>
                       <p className="text-[10px] font-mono text-slate-400">{selectedLog.resourceId || "No direct link"}</p>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Forensic Severity</label>
                       <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border uppercase ${getSeverityColor(selectedLog.severity)}`}>
                         {selectedLog.severity}
                       </span>
                    </div>
                 </div>

                 {/* Description Block */}
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Technical Description</label>
                    <p className="text-lg font-bold text-slate-900 leading-snug">{selectedLog.description}</p>
                 </div>

                 {/* Payload Explorer */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Operational Payload</label>
                    
                    <div className="grid grid-cols-1 gap-4">
                       {selectedLog.payload.previousState && (
                          <div className="space-y-1.5">
                             <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">PREVIOUS STATE</span>
                             </div>
                             <pre className="p-4 bg-slate-900 rounded-2xl overflow-x-auto text-[11px] font-mono text-red-200">
                               {JSON.stringify(JSON.parse(selectedLog.payload.previousState), null, 2)}
                             </pre>
                          </div>
                       )}
                       
                       {selectedLog.payload.newState && (
                          <div className="space-y-1.5">
                             <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">NEW STATE</span>
                             </div>
                             <pre className="p-4 bg-slate-900 rounded-2xl overflow-x-auto text-[11px] font-mono text-green-200">
                               {JSON.stringify(JSON.parse(selectedLog.payload.newState), null, 2)}
                             </pre>
                          </div>
                       )}

                       {(!selectedLog.payload.previousState && !selectedLog.payload.newState) && (
                          <div className="py-12 bg-slate-50 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center">
                             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">State Data Omitted</p>
                             <p className="text-[10px] text-slate-400 font-medium">This action has no direct data snapshots.</p>
                          </div>
                       )}
                    </div>

                    {selectedLog.payload.diff && selectedLog.payload.diff.length > 0 && (
                      <div className="pt-4">
                         <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 block">SPECIFIC CHANGES</span>
                         <ul className="space-y-1">
                            {selectedLog.payload.diff.map((diff, i) => (
                              <li key={i} className="text-xs text-slate-600 font-bold flex items-center gap-2">
                                 <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                 {diff}
                              </li>
                            ))}
                         </ul>
                      </div>
                    )}
                 </div>
              </div>

           </div>
        </div>
      )}

    </div>
  );
}
