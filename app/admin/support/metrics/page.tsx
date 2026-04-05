"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";

export default function AdminMetricsPage() {
  const router = useRouter();
  const { apiFetch, user } = useAuthContext();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch("/api/admin/support/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
  }, []);

  if (user?.role !== 'Admin') return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <button 
        onClick={() => router.push("/admin/support")}
        className="text-sm text-blue-600 hover:underline mb-2 flex items-center gap-2"
      >
        &larr; Back to Tickets
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Detailed Metrics</h1>
      
      {stats ? (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-4 text-gray-800">
           <h2 className="text-lg font-semibold mb-4">Support Center Analytics</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <p className="text-gray-500 text-sm mb-1">Total Lifetime Tickets Created</p>
               <p className="text-3xl font-bold text-gray-900">{stats.totalTickets}</p>
             </div>
             <div>
               <p className="text-gray-500 text-sm mb-1">Active (Open/In-progress)</p>
               <p className="text-3xl font-bold text-blue-600">{stats.openTickets}</p>
             </div>
             <div>
               <p className="text-gray-500 text-sm mb-1">Total Messages Exchanged</p>
               <p className="text-3xl font-bold text-indigo-600">{stats.totalMessages}</p>
             </div>
             <div>
               <p className="text-gray-500 text-sm mb-1">Average Resolution Time</p>
               <p className="text-3xl font-bold text-green-600">{stats.avgResolutionHours} hours</p>
             </div>
           </div>
        </div>
      ) : (
        <p>Loading metrics...</p>
      )}
    </div>
  );
}
