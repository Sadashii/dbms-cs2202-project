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
    }, 5000);
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

  if (user?.role !== 'Admin') return <div className="p-8 text-center text-red-600 font-black uppercase">Unauthorized</div>;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 p-2 md:p-6">
      <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col lg:flex-row bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-colors">
        
        {/* Sidebar: Metadata & Controls */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col p-6 overflow-y-auto">
          <button 
            onClick={() => router.push("/admin/support")}
            className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8 flex items-center gap-2 group transition-all"
          >
            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Back to Terminal
          </button>

          <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6">Protocol Metadata</h2>
          
          <div className="space-y-6 flex-1">
             <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
               <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Origin Principal</p>
               <p className="text-sm font-black text-gray-900 dark:text-white">{ticket.userId?.firstName} {ticket.userId?.lastName}</p>
               <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono mt-1 truncate">{ticket.userId?.email}</p>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">Category</p>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{ticket.category}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">Priority</p>
                  <span className="px-2 py-0.5 text-[9px] font-black rounded bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 uppercase">{ticket.priority}</span>
                </div>
             </div>

             <div className="space-y-2">
               <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">Current Status</p>
               <span className="px-3 py-1 text-[10px] font-black uppercase rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30 block w-fit">
                 {ticket.currentStatus}
               </span>
             </div>

             <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
               <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Command Override</p>
               <div className="flex flex-col gap-2">
                  {['Open', 'In-Progress', 'Resolved'].map((status) => (
                    ticket.currentStatus !== status && (
                      <Button 
                        key={status} 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUpdateStatus(status)} 
                        disabled={statusUpdating}
                        className="text-[10px] font-black uppercase rounded-xl dark:border-slate-800 dark:text-white"
                      >
                        Set to {status}
                      </Button>
                    )
                  ))}
                  {ticket.currentStatus !== 'Closed' && (
                    <button 
                      onClick={() => handleUpdateStatus('Closed')} 
                      disabled={statusUpdating} 
                      className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest hover:underline mt-2"
                    >
                      Terminate Ticket
                    </button>
                  )}
               </div>
             </div>
          </div>
        </div>

        {/* Main Conversation Engine */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
          {/* Header */}
          <div className="px-8 py-5 border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur flex items-center justify-between">
              <div>
                <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{ticket.subject}</h1>
                <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 uppercase tracking-widest">Protocol ID: {ticket.ticketId}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase">Secure Link</span>
              </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-8 overflow-y-auto space-y-8 custom-scrollbar">
              {messages.map((msg, index) => {
                const isSupport = msg.senderRole === 'Support' || msg.senderRole === 'Admin';
                return (
                  <div key={msg._id || index} className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[80%] md:max-w-[70%] rounded-[1.5rem] px-6 py-4 shadow-sm transition-all ${
                        isSupport 
                          ? 'bg-blue-600 text-white rounded-br-none shadow-blue-500/20' 
                          : 'bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-slate-800 shadow-slate-900/10'
                      }`}
                    >
                      {!isSupport && (
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                          {msg.senderId?.firstName || 'Customer'}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed font-medium">{msg.message}</p>
                      <p className={`text-[9px] font-mono mt-3 text-right uppercase tracking-tighter ${isSupport ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
          </div>

          {/* Reply Interface */}
          <div className="p-6 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 transition-colors">
              <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Dispatch reply to principal..."
                    disabled={isSending}
                    className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[80px] shadow-sm transition-all"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                    }}
                  />
                </div>
                <Button 
                  type="submit" 
                  variant="primary" 
                  isLoading={isSending} 
                  className="h-auto py-4 sm:py-0 sm:h-[80px] px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-600/20"
                >
                  Send Reply
                </Button>
              </form>
              <div className="mt-3 flex items-center gap-2">
                 <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-gray-400 border rounded">Enter</kbd>
                 <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">to dispatch message packet</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}