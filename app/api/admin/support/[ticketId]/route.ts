import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import Complaint from '../../../../../models/Complaints';
import ComplaintMessage from '../../../../../models/ComplaintMessage';
import { verifyAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ ticketId: string }> }) {
    try {
        await dbConnect();
        const decoded = verifyAuth(req.headers);
        if (!decoded || decoded.role !== 'Admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        const { role } = decoded;

        const { ticketId } = await params;
        const ticket = await Complaint.findOne({ ticketId }).populate('userId', 'firstName lastName email');
        if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        
        const messages = await ComplaintMessage.find({ complaintId: ticket._id }).populate('senderId', 'firstName lastName').sort({ createdAt: 1 });
        return NextResponse.json({ ticket, messages }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ ticketId: string }> }) {
    try {
        await dbConnect();
        const decoded = verifyAuth(req.headers);
        if (!decoded || decoded.role !== 'Admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        const { userId, role } = decoded;

        const { ticketId } = await params;
        const body = await req.json();
        const { status, priority, category } = body;

        const ticket = await Complaint.findOne({ ticketId });
        if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

        let updated = false;
        
        if (status && status !== ticket.currentStatus) {
            ticket.currentStatus = status;
            ticket.statusHistory.push({
                state: status,
                updatedBy: userId,
                updatedAt: new Date(),
                remarks: 'Status updated by Admin'
            });
            updated = true;
        }

        if (priority && priority !== ticket.priority) {
            ticket.priority = priority;
            updated = true;
        }

        if (category && category !== ticket.category) {
             // In actual Complaint.ts model, category is immutable, but we commented the immutable part?
             // Actually, Complaint.ts says category is immutable. We will skip updating category.
        }

        if (updated) {
            await ticket.save();
        }

        return NextResponse.json({ success: true, ticket }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
    }
}
