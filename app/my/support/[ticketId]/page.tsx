"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
    _id: string;
    senderRole: string;
    message: string;
    createdAt: string;
}

interface Ticket {
    ticketId: string;
    subject: string;
    category: string;
    currentStatus: string;
    createdAt: string;
}

export default function TicketChatPage() {
    const { ticketId } = useParams();
    const router = useRouter();
    const { apiFetch, user } = useAuthContext();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchTicketDetails = async () => {
        try {
            const res = await apiFetch(`/api/support/${ticketId}`);
            if (res.ok) {
                const data = await res.json();
                setTicket(data.ticket);
                setMessages(data.messages);
            } else if (res.status === 404) {
                router.push("/my/support");
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
                body: JSON.stringify({
                    message: newMessage,
                    sendAs: "Customer",
                }),
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

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
            {}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                    <button
                        onClick={() => router.push("/my/support")}
                        className="text-sm text-blue-600 hover:underline mb-1 inline-block"
                    >
                        &larr; Back to Tickets
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900">
                        {ticket.subject}
                    </h1>
                    <div className="flex gap-3 text-sm text-gray-500 mt-1">
                        <span>Ticket ID: {ticket.ticketId}</span>
                        <span>&bull;</span>
                        <span>Category: {ticket.category}</span>
                        <span>&bull;</span>
                        <span
                            className={`font-medium ${
                                ticket.currentStatus === "Closed" ||
                                ticket.currentStatus === "Resolved"
                                    ? "text-green-600"
                                    : "text-blue-600"
                            }`}
                        >
                            {ticket.currentStatus}
                        </span>
                    </div>
                </div>
            </div>

            {}
            <div className="flex-1 p-6 overflow-y-auto bg-white space-y-6">
                {messages.map((msg, index) => {
                    const isCustomer = msg.senderRole === "Customer";
                    return (
                        <div
                            key={msg._id || index}
                            className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                                    isCustomer
                                        ? "bg-blue-600 text-white rounded-br-sm"
                                        : "bg-gray-100 text-gray-900 rounded-bl-sm border border-gray-200"
                                }`}
                            >
                                {!isCustomer && (
                                    <p className="text-xs font-semibold text-gray-500 mb-1">
                                        Support Agent
                                    </p>
                                )}
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                    {msg.message}
                                </p>
                                <p
                                    className={`text-[10px] mt-2 text-right ${isCustomer ? "text-blue-200" : "text-gray-400"}`}
                                >
                                    {new Date(msg.createdAt).toLocaleTimeString(
                                        [],
                                        {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        },
                                    )}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {}
            {ticket.currentStatus !== "Closed" &&
            ticket.currentStatus !== "Resolved" ? (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <form
                        onSubmit={handleSendMessage}
                        className="flex gap-3 items-end"
                    >
                        <div className="flex-1">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message here..."
                                disabled={isSending}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-[60px] "
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
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
                            className="h-[60px] px-6 rounded-lg"
                        >
                            Send
                        </Button>
                    </form>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                        Press Enter to send, Shift + Enter for new line
                    </p>
                </div>
            ) : (
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600">
                        This ticket has been marked as {ticket.currentStatus}.
                        If you need further assistance, please open a new ticket
                        or reply to reopen.
                    </p>
                    <form
                        onSubmit={handleSendMessage}
                        className="flex gap-3 items-end justify-center mt-3 max-w-lg mx-auto"
                    >
                        <div className="flex-1">
                            <input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Reply to re-open..."
                                disabled={isSending}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="secondary"
                            isLoading={isSending}
                        >
                            Reply & Re-open
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
