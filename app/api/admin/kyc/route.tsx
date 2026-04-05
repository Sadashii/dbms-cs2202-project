import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import KYC from "@/models/KYC";
import User from "@/models/User"; // Required to populate

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Fetch KYCs. Custom sorting: Pending and In-Review first, then by date.
        const kycRecords = await KYC.find()
            .populate({ path: 'userId', select: 'email firstName lastName' })
            .sort({ currentStatus: -1, createdAt: -1 }) 
            .lean();

        // Re-sort in JS if you want strict priority: Pending -> In-Review -> Others
        const statusPriority: Record<string, number> = {
            'Pending': 1,
            'In-Review': 2,
            'Verified': 3,
            'Rejected': 4,
            'Expired': 5
        };

        const sortedRecords = kycRecords.sort((a, b) => {
            const priorityA = statusPriority[a.currentStatus] || 99;
            const priorityB = statusPriority[b.currentStatus] || 99;
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            // If same status, newest first
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return NextResponse.json(sortedRecords, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching KYCs:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}