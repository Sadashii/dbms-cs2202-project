import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/mongodb";
import Complaint from "../../../../../models/Complaints";
import ComplaintMessage from "../../../../../models/ComplaintMessage";
import { verifyAuth } from "@/lib/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ ticketId: string }> },
) {
    try {
        await dbConnect();
        const decoded = verifyAuth(req.headers);
        if (!decoded) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }
        const { userId, role } = decoded;

        const { ticketId } = await params;
        const body = await req.json();
        const { message, sendAs } = body;

        if (!message) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 },
            );
        }

        const isSendingAsSupport = sendAs === "Support";
        if (isSendingAsSupport && role !== "Admin") {
            return NextResponse.json(
                { error: "Unauthorized to send as Support" },
                { status: 403 },
            );
        }

        const query = isSendingAsSupport ? { ticketId } : { ticketId, userId };
        const ticket = await Complaint.findOne(query);

        if (!ticket) {
            return NextResponse.json(
                { error: "Ticket not found" },
                { status: 404 },
            );
        }

        const newMessage = await ComplaintMessage.create({
            complaintId: ticket._id,
            senderId: userId,
            senderRole: isSendingAsSupport ? "Support" : "Customer",
            message: message,
        });

        if (!isSendingAsSupport && ticket.currentStatus === "Resolved") {
            ticket.currentStatus = "Re-Opened";
            ticket.statusHistory.push({
                state: "Re-Opened",
                updatedBy: userId,
                updatedAt: new Date(),
                remarks: "Automatically reopened due to customer reply",
            });
            await ticket.save();
        }

        return NextResponse.json(
            { success: true, message: newMessage },
            { status: 201 },
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to send message" },
            { status: 500 },
        );
    }
}
