import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import KYC from "@/models/KYC";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { createAuditLog } from "@/lib/audit";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        await dbConnect();
        const { id } = await context.params;

        const kycRecord = await KYC.findById(id).populate({ path: 'userId', select: 'email firstName lastName' }).lean();

        if (!kycRecord) {
            return NextResponse.json({ message: "KYC record not found" }, { status: 404 });
        }

        return NextResponse.json(kycRecord, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching KYC:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}


export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const decoded = verifyAuth(await headers());
        if (!decoded || !['Admin', 'Manager', 'Employee'].includes(decoded.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = (await context.params); 
        const body = await req.json();
        const { status, rejectionReason } = body;

        const validStatuses = ['Pending', 'In-Review', 'Verified', 'Rejected', 'Expired'];

        if (!validStatuses.includes(status)) {
            return NextResponse.json({ message: "Invalid status provided." }, { status: 400 });
        }

        // Find the specific KYC document
        const kycRecord = await KYC.findById(id);

        if (!kycRecord) {
            return NextResponse.json({ message: "KYC record not found" }, { status: 404 });
        }

        const prevState = kycRecord.currentStatus;

        // Update the document
        kycRecord.currentStatus = status;

        if (status === 'Rejected' && rejectionReason) {
            if (!kycRecord.metadata) kycRecord.metadata = {};
            kycRecord.metadata.rejectionReason = rejectionReason;
        } else if (status === 'Verified') {
            if (kycRecord.metadata && kycRecord.metadata.rejectionReason) {
                kycRecord.metadata.rejectionReason = undefined;
            }
        }

        await kycRecord.save();

        // Log the action
        await createAuditLog({
            userId: decoded.userId,
            userRole: decoded.role,
            actionType: status === 'Verified' ? 'KYC_VERIFIED' : status === 'Rejected' ? 'KYC_REJECTED' : 'KYC_SUBMITTED',
            category: 'Security',
            severity: status === 'Verified' ? 'Medium' : 'High',
            resource: 'KYC',
            resourceId: kycRecord._id,
            description: `KYC status changed from ${prevState} to ${status}`,
            currentStatus: 'Success',
            payload: {
                previousState: JSON.stringify({ status: prevState }),
                newState: JSON.stringify({ status, rejectionReason }),
            },
        });

        return NextResponse.json({
            message: `KYC successfully updated to ${status}`,
            record: kycRecord
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error updating KYC:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}