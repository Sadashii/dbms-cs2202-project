"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Ticket {
  _id: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  currentStatus: string;
  lastMessageAt: string;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Stats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  totalMessages: number;
  avgResolutionHours: string;
}

export default function AdminSupportPage() {
  const router = useRouter();
  const { apiFetch, user } = useAuthContext();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const statsRes = await apiFetch("/api/admin/support/stats");
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      const ticketsRes = await apiFetch(`/api/admin/support?status=${statusFilter}`);
      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const filteredTickets = tickets.filter(ticket => 
    ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ticket.userId && `${ticket.userId.firstName} ${ticket.userId.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In-Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Re-Opened': return 'bg-orange-100 text-orange-800';
      case 'Resolved': case 'Closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch(priority) {
      case 'Low': return 'bg-gray-100 text-gray-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'Admin') {
    return <div className="p-8 text-center text-red-600">Unauthorized. Admin access required.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-500">Manage customer support tickets.</p>
        </div>
        <Button onClick={() => router.push("/admin/support/metrics")} variant="secondary">
          View detailed metrics
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Total Tickets</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.totalTickets}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Open Tickets</p>
            <p className="text-2xl font-semibold text-blue-600 mt-1">{stats.openTickets}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Resolved</p>
            <p className="text-2xl font-semibold text-green-600 mt-1">{stats.resolvedTickets}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Avg Resolution</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.avgResolutionHours}h</p>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
          <div className="w-1/3">
             <input
               type="text"
               placeholder="Search by ID, Subject or Customer..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
             />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Re-Opened">Re-Opened</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No tickets found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket._id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/support/${ticket.ticketId}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{ticket.subject}</div>
                      <div className="text-xs font-mono text-gray-500">{ticket.ticketId} &bull; {ticket.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      {ticket.userId ? (
                        <>
                          <div className="text-sm text-gray-900">{ticket.userId.firstName} {ticket.userId.lastName}</div>
                          <div className="text-xs text-gray-500">{ticket.userId.email}</div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">Unknown User</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(ticket.currentStatus)}`}>
                        {ticket.currentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ticket.lastMessageAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
