import { useState, useEffect } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export interface Ticket {
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

export interface Stats {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    totalMessages: number;
    avgResolutionHours: string;
}

export const useAdminSupport = () => {
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

            const ticketsRes = await apiFetch(
                `/api/admin/support?status=${statusFilter}`,
            );
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

    const filteredTickets = tickets.filter(
        (ticket) =>
            ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ticket.userId &&
                `${ticket.userId.firstName} ${ticket.userId.lastName}`
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())),
    );

    return {
        tickets,
        stats,
        isLoading,
        statusFilter,
        setStatusFilter,
        searchQuery,
        setSearchQuery,
        filteredTickets,
        user,
        router,
        fetchData,
    };
};
