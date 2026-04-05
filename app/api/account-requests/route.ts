import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import AccountRequest from "@/models/AccountRequests";
import KYC from "@/models/KYC";
import {verifyAuth} from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

async function saveFile(file: File, prefix: string) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'tmp';
    const filename = `${prefix}-${Date.now()}.${ext}`;
    const publicPath = path.join(process.cwd(), 'public', 'uploads', 'kyc');
    
    await fs.mkdir(publicPath, { recursive: true });
    await fs.writeFile(path.join(publicPath, filename), buffer);
    return `/uploads/kyc/${filename}`;
}

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

        // Actually save the uploaded files
        const panCardFileUrl = await saveFile(panCard, 'pan');
        const signatureFileUrl = await saveFile(signature, 'signature');
        const aadharFileUrl = await saveFile(aadhar, 'aadhar');

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

export async function PATCH(req: NextRequest) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const userId = decoded.userId;
        const formData = await req.formData();
        
        const panCard = formData.get("panCard") as File | null;
        const signature = formData.get("signature") as File | null;
        const aadhar = formData.get("aadhar") as File | null;
        const panNumber = formData.get("panNumber") as string;
        const aadharNumber = formData.get("aadharNumber") as string;

        const request = await AccountRequest.findOne({ userId, currentStatus: { $ne: 'Approved' } });
        if (!request) return NextResponse.json({ message: "No active account request found for remediation." }, { status: 404 });

        const updates: any = {};
        
        if (panCard) {
            const url = await saveFile(panCard, 'pan');
            request.kycDocuments.panCardFileUrl = url;
            await KYC.findOneAndUpdate(
                { userId, documentType: 'PAN' }, 
                { 
                    currentStatus: 'Pending', 
                    attachments: [{ fileUrl: url, fileName: panCard.name, fileType: 'Front' }],
                    documentDetails: panNumber ? { encryptedNumber: Buffer.from(panNumber).toString('base64'), numberHash: Buffer.from(panNumber).toString('hex') } : undefined
                }, 
                { upsert: true }
            );
            updates.pan = "Updated";
        }

        if (aadhar) {
            const url = await saveFile(aadhar, 'aadhar');
            request.kycDocuments.aadharFileUrl = url;
            await KYC.findOneAndUpdate(
                { userId, documentType: 'Aadhar' }, 
                { 
                    currentStatus: 'Pending', 
                    attachments: [{ fileUrl: url, fileName: aadhar.name, fileType: 'Front' }],
                    documentDetails: aadharNumber ? { encryptedNumber: Buffer.from(aadharNumber).toString('base64'), numberHash: Buffer.from(aadharNumber).toString('hex') } : undefined
                }, 
                { upsert: true }
            );
            updates.aadhar = "Updated";
        }

        if (signature) {
            const url = await saveFile(signature, 'signature');
            request.kycDocuments.signatureFileUrl = url;
            // Handle Signature KYC if your model tracks it, or just update the request
            updates.signature = "Updated";
        }

        request.currentStatus = "Pending_KYC";
        await request.save();

        return NextResponse.json({ message: "Documents re-submitted successfully.", updates });

    } catch (error: any) {
        console.error("KYC Remediation Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}