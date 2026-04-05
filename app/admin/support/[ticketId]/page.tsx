"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

interface Message {
  _id: string;
  senderRole: string;
  senderId?: {
      firstName: string;
      lastName: string;
  };
  message: string;
  createdAt: string;
}

interface Ticket {
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  currentStatus: string;
  createdAt: string;
  userId: {
      firstName: string;
      lastName: string;
      email: string;
  };
}

export default function AdminTicketViewPage() {
  const { ticketId } = useParams();
  const router = useRouter();
  const { apiFetch, user } = useAuthContext();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [statusUpdating, setStatusUpdating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicketDetails = async () => {
    try {
      const res = await apiFetch(`/api/admin/support/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
        setMessages(data.messages);
      } else {
        router.push("/admin/support");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
    const interval = setInterval(() => {
      fetchTicketDetails();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const res = await apiFetch(`/api/support/${ticketId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: newMessage, sendAs: "Support" }),
      });
      if (res.ok) {
        setNewMessage("");
        await fetchTicketDetails();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      const res = await apiFetch(`/api/admin/support/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchTicketDetails();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setStatusUpdating(false);
    }
  };

  if (user?.role !== 'Admin') return <div className="p-8 text-center text-red-600">Unauthorized.</div>;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-fade-in my-6">
      
      {/* Sidebar for Controls */}
      <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col p-6 overflow-y-auto">
        <button 
          onClick={() => router.push("/admin/support")}
          className="text-sm text-blue-600 hover:underline mb-6 flex items-center gap-2"
        >
          &larr; Back to Tickets
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Ticket Info</h2>
        <div className="space-y-4 flex-1">
           <div>
             <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Customer</p>
             <p className="text-sm font-medium text-gray-900">{ticket.userId?.firstName} {ticket.userId?.lastName}</p>
             <p className="text-xs text-gray-500">{ticket.userId?.email}</p>
           </div>
           
           <div>
             <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Category</p>
             <p className="text-sm text-gray-900">{ticket.category}</p>
           </div>

           <div>
             <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Priority</p>
             <div className="mt-1">
                <span className={`px-2 py-1 text-xs font-semibold rounded-md bg-gray-200 text-gray-800`}>{ticket.priority}</span>
             </div>
           </div>

           <div>
             <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Current Status</p>
             <p className="text-sm font-medium text-gray-900">{ticket.currentStatus}</p>
           </div>

           <div className="pt-4 border-t border-gray-200">
             <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Actions</p>
             <div className="flex flex-col gap-2">
                {ticket.currentStatus !== 'Open' && (
                  <Button variant="secondary" size="sm" onClick={() => handleUpdateStatus('Open')} disabled={statusUpdating}>Mark as Open</Button>
                )}
                {ticket.currentStatus !== 'In-Progress' && (
                  <Button variant="secondary" size="sm" onClick={() => handleUpdateStatus('In-Progress')} disabled={statusUpdating}>Mark as In-Progress</Button>
                )}
                {ticket.currentStatus !== 'Resolved' && (
                  <Button variant="secondary" size="sm" onClick={() => handleUpdateStatus('Resolved')} disabled={statusUpdating}>Mark as Resolved</Button>
                )}
                {ticket.currentStatus !== 'Closed' && (
                  <button onClick={() => handleUpdateStatus('Closed')} disabled={statusUpdating} className="text-xs text-red-600 hover:underline mt-2">Close Ticket</button>
                )}
             </div>
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <h1 className="text-lg font-semibold text-gray-900">{ticket.subject}</h1>
            <p className="text-xs text-gray-500">Ticket ID: {ticket.ticketId}</p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-white space-y-6">
            {messages.map((msg, index) => {
            const isSupport = msg.senderRole === 'Support' || msg.senderRole === 'Admin';
            return (
                <div key={msg._id || index} className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}>
                <div 
                    className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                    isSupport 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm border border-gray-200'
                    }`}
                >
                    {!isSupport && (
                    <p className="text-xs font-semibold text-gray-500 mb-1">{msg.senderId?.firstName || 'Customer'}</p>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
                    <p className={`text-[10px] mt-2 text-right ${isSupport ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                </div>
            );
            })}
            <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
            <div className="flex-1">
                <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Reply to customer..."
                disabled={isSending}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-[60px]"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                    }
                }}
                />
            </div>
            <Button type="submit" variant="primary" isLoading={isSending} className="h-[60px] px-6 rounded-lg">
                Send Reply
            </Button>
            </form>
        </div>
      </div>
    </div>
  );
}
