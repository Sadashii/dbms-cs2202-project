import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Complaint from '@/models/Complaints';
import ComplaintMessage from '@/models/ComplaintMessage';
import mongoose from 'mongoose';
import { verifyAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
    try {
        await dbConnect();
        const decoded = verifyAuth(await headers());
        
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { userId } = decoded;
        
        const tickets = await Complaint.find({ userId: userId }).sort({ lastMessageAt: -1 });
        return NextResponse.json({ tickets }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const decoded = verifyAuth(await headers()); 
        
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { userId } = decoded;

        const body = await req.json();
        const { subject, category, description } = body;
        
        if (!subject || !category || !description) {
             return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

        const newTicket = await Complaint.create({
            ticketId,
            userId,
            category,
            subject,
            description,
            currentStatus: 'Open',
            statusHistory: [{ state: 'Open', updatedAt: new Date() }],
            lastMessageAt: new Date()
        });

        await ComplaintMessage.create({
            complaintId: newTicket._id,
            senderId: userId,
            senderRole: 'Customer',
            message: description
        });

        // Log the action
        await createAuditLog({
            userId: decoded.userId,
            userRole: decoded.role,
            actionType: 'SUPPORT_TICKET_CREATED',
            category: 'Operational',
            severity: 'Low',
            resource: 'Complaint',
            resourceId: newTicket._id,
            description: `New support ticket created: ${subject}`,
            currentStatus: 'Success',
            payload: {
                newState: JSON.stringify({
                    ticketId: newTicket.ticketId,
                    category,
                    subject,
                }),
            },
        });

        return NextResponse.json({ success: true, ticket: newTicket }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }
}
