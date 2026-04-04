import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import KYC from "@/models/KYC";

export async function PATCH(
    req: NextRequest,
    context: { params: { id: string } }
) {
    try {
        await dbConnect();

        const { id } = (await context.params); // ✅ safe access
        const body = await req.json();
        const { status, rejectionReason } = body;

        const validStatuses = ['Pending', 'In-Review', 'Verified', 'Rejected', 'Expired'];

        if (!validStatuses.includes(status)) {
            return NextResponse.json({ message: "Invalid status provided." }, { status: 400 });
        }

        // Find the specific KYC document
        console.log(id)
        const kycRecord = await KYC.findById(id);

        if (!kycRecord) {
            return NextResponse.json({ message: "KYC record not found" }, { status: 404 });
        }

        // Update the document
        kycRecord.currentStatus = status;

        if (status === 'Rejected' && rejectionReason) {
            if (!kycRecord.metadata) kycRecord.metadata = {};
            kycRecord.metadata.rejectionReason = rejectionReason;
        } else if (status === 'Verified') {
            // Clear out any old rejection reasons if it's now being approved
            if (kycRecord.metadata && kycRecord.metadata.rejectionReason) {
                kycRecord.metadata.rejectionReason = undefined;
            }
        }

        // Trigger the save hook to log the state change in statusHistory
        await kycRecord.save();

        return NextResponse.json({
            message: `KYC successfully updated to ${status}`,
            record: kycRecord
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error updating KYC:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}