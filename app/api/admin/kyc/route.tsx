import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import KYC from "@/models/KYC";
import { autoApproveSignatureDocuments } from "@/lib/kycWorkflow";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const signatureOwners = await KYC.distinct("userId", {
            documentType: "Signature",
            currentStatus: { $ne: "Verified" },
        });

        await Promise.all(
            signatureOwners.map((userId) =>
                autoApproveSignatureDocuments(String(userId)),
            ),
        );

        const kycRecords = await KYC.find()
            .populate({
                path: "userId",
                select: "email firstName lastName customerId",
            })
            .sort({ currentStatus: -1, createdAt: -1 })
            .lean();

        const statusPriority: Record<string, number> = {
            Pending: 1,
            "In-Review": 2,
            Verified: 3,
            Rejected: 4,
            Expired: 5,
        };

        const sortedRecords = kycRecords.sort((a, b) => {
            const priorityA = statusPriority[a.currentStatus] || 99;
            const priorityB = statusPriority[b.currentStatus] || 99;
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
        });

        const enrichedRecords = sortedRecords.map((doc) => {
            const hasBeenRejected = doc.statusHistory?.some(
                (h: any) => h.state === "Rejected",
            );
            const isReuploaded =
                (doc.currentStatus === "Pending" ||
                    doc.currentStatus === "In-Review") &&
                hasBeenRejected;
            return {
                ...doc,
                isReuploaded,
            };
        });

        return NextResponse.json(enrichedRecords, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching KYCs:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}
