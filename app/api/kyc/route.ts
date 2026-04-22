import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import KYC from "@/models/KYC";
import AccountRequest from "@/models/AccountRequests";
import { verifyAuth } from "@/lib/auth";
import { autoApproveSignatureDocuments } from "@/lib/kycWorkflow";

export async function GET() {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        await autoApproveSignatureDocuments(decoded.userId);

        const kycs = await KYC.find({ userId: decoded.userId }).sort({
            createdAt: -1,
        });

        const accountRequests = await AccountRequest.find({
            userId: decoded.userId,
        }).sort({ createdAt: -1 });

        return NextResponse.json({
            documents: kycs,
            requests: accountRequests,
        });
    } catch (error) {
        console.error("KYC Fetch Error:", error);
        return NextResponse.json(
            { message: "Failed to fetch KYC status." },
            { status: 500 },
        );
    }
}
