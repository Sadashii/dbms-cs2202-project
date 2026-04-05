import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Complaint from '../../../../models/Complaints';
import { verifyAuth } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await dbConnect();
        const decoded = verifyAuth(req.headers);
        
        if (!decoded || decoded.role !== 'Admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }
        const { role } = decoded;
        
        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const query: any = {};
        
        if (status && status !== 'All') {
            query.currentStatus = status;
        }

        // Populate userId to get customer details
        const tickets = await Complaint.find(query)
            .populate('userId', 'firstName lastName email')
            .sort({ lastMessageAt: -1 });

        return NextResponse.json({ tickets }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
