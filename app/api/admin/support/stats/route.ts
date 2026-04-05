import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import Complaint from '../../../../../models/Complaints';
import ComplaintMessage from '../../../../../models/ComplaintMessage';
import { verifyAuth } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await dbConnect();
        const decoded = verifyAuth(req.headers);
        
        if (!decoded || decoded.role !== 'Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const { role } = decoded;
        
        const totalTickets = await Complaint.countDocuments();
        const openTickets = await Complaint.countDocuments({ currentStatus: { $in: ['Open', 'In-Progress', 'Re-Opened'] } });
        const resolvedTickets = await Complaint.countDocuments({ currentStatus: 'Resolved' });
        const closedTickets = await Complaint.countDocuments({ currentStatus: 'Closed' });
        const totalMessages = await ComplaintMessage.countDocuments();

        // Calculate average resolution time
        const resolvedData = await Complaint.aggregate([
            { $match: { currentStatus: { $in: ['Resolved', 'Closed'] }, resolvedAt: { $exists: true } } },
            { $project: { resolutionTime: { $subtract: ["$resolvedAt", "$createdAt"] } } },
            { $group: { _id: null, avgResolutionTimeMs: { $avg: "$resolutionTime" } } }
        ]);

        let avgResolutionHours = 0;
        if (resolvedData.length > 0) {
             // avgResolutionTimeMs is in milliseconds, convert to hours
             avgResolutionHours = resolvedData[0].avgResolutionTimeMs / (1000 * 60 * 60);
        }

        return NextResponse.json({ 
            stats: {
                totalTickets,
                openTickets,
                resolvedTickets,
                closedTickets,
                totalMessages,
                avgResolutionHours: avgResolutionHours.toFixed(2)
            }
         }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
