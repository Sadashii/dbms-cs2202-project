import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Complaint from '../../../../models/Complaints';
import ComplaintMessage from '../../../../models/ComplaintMessage';
import { verifyAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ ticketId: string }> }) {
    try {
        await dbConnect();
        const decoded = verifyAuth(req.headers);
        
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { userId } = decoded;

        const { ticketId } = await params;

        const ticket = await Complaint.findOne({ ticketId, userId });
        
        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }
        
        const messages = await ComplaintMessage.find({ complaintId: ticket._id }).sort({ createdAt: 1 });

        return NextResponse.json({ ticket, messages }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
