import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import AccountRequest from "@/models/AccountRequests";
import KYC from "@/models/KYC";
import { verifyAuth } from "@/lib/auth";
import {
    autoApproveSignatureDocuments,
    getLatestKycDocumentsForRequest,
} from "@/lib/kycWorkflow";

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export async function GET() {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );
        }

        if (decoded.role !== "Admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        await dbConnect();

        const requests = await AccountRequest.find()
            .populate({ path: "userId", select: "firstName lastName email" })
            .sort({ createdAt: -1 })
            .lean();

        const enhancedRequests = await Promise.all(
            requests.map(async (request) => {
                await autoApproveSignatureDocuments(String(request.userId._id));

                const latestRequestKycs = await getLatestKycDocumentsForRequest({
                    _id: request._id,
                    userId: request.userId._id,
                    kycDocuments: request.kycDocuments,
                });

                const userKycs = await KYC.find({
                    _id: { $in: latestRequestKycs.map((kyc) => kyc._id) },
                })
                    .select(
                        "kycReference documentType currentStatus attachments documentDetails verifiedAt metadata createdAt updatedAt",
                    )
                    .lean();

                return {
                    ...request,
                    kycs: userKycs,
                };
            }),
        );

        return NextResponse.json(enhancedRequests, { status: 200 });
    } catch (error: unknown) {
        console.error("Error fetching account requests:", error);
        return NextResponse.json(
            { message: getErrorMessage(error, "Internal server error") },
            { status: 500 },
        );
    }
}
