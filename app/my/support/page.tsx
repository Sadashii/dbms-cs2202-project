"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

interface Complaint {
  _id: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  currentStatus: string;
  lastMessageAt: string;
  createdAt: string;
}

export default function SupportPage() {
  const { apiFetch, requireAuth } = useAuthContext();
  const [tickets, setTickets] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Account");
  const [description, setDescription] = useState("");

  requireAuth("/auth/login");

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch("/api/support");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [apiFetch]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await apiFetch("/api/support", {
        method: "POST",
        body: JSON.stringify({ subject, category, description })
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setSubject("");
        setDescription("");
        alert("Support ticket created successfully."); // Replace with Toast
        fetchTickets();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to create ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In-Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': case 'Closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
          <p className="text-sm text-gray-500">View your support tickets and contact customer care.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary">Create Ticket</Button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No support tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{ticket.ticketId}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{ticket.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(ticket.currentStatus)}`}>
                        {ticket.currentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ticket.lastMessageAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Open Support Ticket"
        description="Describe your issue below, and our support team will get back to you shortly."
      >
        <form onSubmit={handleSubmitTicket} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="Account">Account Issues</option>
              <option value="Transaction">Transaction Failed</option>
              <option value="Card">Card Lost/Stolen</option>
              <option value="Loan">Loan Inquiry</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <Input
            label="Subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="Briefly describe the issue"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-32"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="Provide as much detail as possible..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 mt-6">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}