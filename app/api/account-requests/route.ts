import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import AccountRequest from "@/models/AccountRequests";
import KYC from "@/models/KYC";
import {verifyAuth} from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = decoded.userId;

        await dbConnect();

        const formData = await req.formData();
        const accountType = formData.get("accountType") as string;
        const panNumber = formData.get("panNumber") as string;
        const aadharNumber = formData.get("aadharNumber") as string;

        const panCard = formData.get("panCard") as File | null;
        const signature = formData.get("signature") as File | null;
        const aadhar = formData.get("aadhar") as File | null;

        if (!accountType || !panCard || !signature || !aadhar || !panNumber || !aadharNumber) {
            return NextResponse.json({ message: "Missing required KYC documents or details" }, { status: 400 });
        }

        const panCardFileUrl = `/mock-storage/kyc/${Date.now()}-${panCard.name.replace(/\s+/g, "-")}`;
        const signatureFileUrl = `/mock-storage/kyc/${Date.now()}-${signature.name.replace(/\s+/g, "-")}`;
        const aadharFileUrl = `/mock-storage/kyc/${Date.now()}-${aadhar.name.replace(/\s+/g, "-")}`;

        const newAccountRequest = await AccountRequest.create({
            userId,
            accountType,
            kycDocuments: {
                panCardFileUrl,
                signatureFileUrl,
                aadharFileUrl
            },
            currentStatus: "Pending_KYC"
        });

        await KYC.create({
            kycReference: `PAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId,
            documentType: 'PAN',
            documentDetails: {
                encryptedNumber: Buffer.from(panNumber).toString('base64'),
                numberHash: Buffer.from(panNumber).toString('hex'),
                issuedCountry: 'India'
            },
            attachments: [{
                fileUrl: panCardFileUrl,
                fileName: panCard.name,
                fileType: 'Front'
            }],
            currentStatus: 'Pending'
        });

        await KYC.create({
            kycReference: `AADHAR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId,
            documentType: 'Aadhar',
            documentDetails: {
                encryptedNumber: Buffer.from(aadharNumber).toString('base64'),
                numberHash: Buffer.from(aadharNumber).toString('hex'),
                issuedCountry: 'India'
            },
            attachments: [{
                fileUrl: aadharFileUrl,
                fileName: aadhar.name,
                fileType: 'Front'
            }],
            currentStatus: 'Pending'
        });

        return NextResponse.json(
            { message: "Account request and KYC submitted successfully.", request: newAccountRequest },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("KYC Submission Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}