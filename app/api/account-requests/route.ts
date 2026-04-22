import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import AccountRequest from "@/models/AccountRequests";
import KYC from "@/models/KYC";
import { verifyAuth } from "@/lib/auth";
import { autoApproveSignatureDocuments } from "@/lib/kycWorkflow";
import path from "path";
import fs from "fs/promises";

async function saveFile(file: File, prefix: string) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "tmp";
    const filename = `${prefix}-${Date.now()}.${ext}`;
    const publicPath = path.join(process.cwd(), "public", "uploads", "kyc");

    await fs.mkdir(publicPath, { recursive: true });
    await fs.writeFile(path.join(publicPath, filename), buffer);
    return `/uploads/kyc/${filename}`;
}

export async function POST(req: NextRequest) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );
        }

        const userId = decoded.userId;

        await dbConnect();

        const formData = await req.formData();
        const accountType = formData.get("accountType") as string;
        const panNumber = formData.get("panNumber") as string;
        const aadharNumber = formData.get("aadharNumber") as string;
        const branchId = formData.get("branchId") as string;

        const panCard = formData.get("panCard") as File | null;
        const signature = formData.get("signature") as File | null;
        const aadhar = formData.get("aadhar") as File | null;

        if (
            !accountType ||
            !panCard ||
            !signature ||
            !aadhar ||
            !panNumber ||
            !aadharNumber
        ) {
            return NextResponse.json(
                { message: "Missing required KYC documents or details" },
                { status: 400 },
            );
        }

        const panCardFileUrl = await saveFile(panCard, "pan");
        const signatureFileUrl = await saveFile(signature, "signature");
        const aadharFileUrl = await saveFile(aadhar, "aadhar");

        const newAccountRequest = await AccountRequest.create({
            userId,
            accountType,
            kycDocuments: {
                panCardFileUrl,
                signatureFileUrl,
                aadharFileUrl,
            },
            branchId: branchId || undefined,
            currentStatus: "Pending_KYC",
        });

        await KYC.create({
            kycReference: `PAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId,
            accountRequestId: newAccountRequest._id,
            documentType: "PAN",
            documentDetails: {
                encryptedNumber: Buffer.from(panNumber).toString("base64"),
                numberHash: Buffer.from(panNumber).toString("hex"),
                issuedCountry: "India",
            },
            attachments: [
                {
                    fileUrl: panCardFileUrl,
                    fileName: panCard.name,
                    fileType: "Front",
                },
            ],
            currentStatus: "Pending",
        });

        await KYC.create({
            kycReference: `AADHAR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId,
            accountRequestId: newAccountRequest._id,
            documentType: "Aadhar",
            documentDetails: {
                encryptedNumber: Buffer.from(aadharNumber).toString("base64"),
                numberHash: Buffer.from(aadharNumber).toString("hex"),
                issuedCountry: "India",
            },
            attachments: [
                {
                    fileUrl: aadharFileUrl,
                    fileName: aadhar.name,
                    fileType: "Front",
                },
            ],
            currentStatus: "Pending",
        });

        await KYC.create({
            kycReference: `SIGNATURE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId,
            accountRequestId: newAccountRequest._id,
            documentType: "Signature",
            documentDetails: {
                issuedCountry: "India",
            },
            attachments: [
                {
                    fileUrl: signatureFileUrl,
                    fileName: signature.name,
                    fileType: "Full",
                },
            ],
            currentStatus: "Verified",
        });

        await autoApproveSignatureDocuments(userId);

        return NextResponse.json(
            {
                message: "Account request and KYC submitted successfully.",
                request: newAccountRequest,
            },
            { status: 201 },
        );
    } catch (error: any) {
        console.error("KYC Submission Error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const userId = decoded.userId;
        const formData = await req.formData();

        const panCard = formData.get("panCard") as File | null;
        const signature = formData.get("signature") as File | null;
        const aadhar = formData.get("aadhar") as File | null;
        const panNumber = formData.get("panNumber") as string;
        const aadharNumber = formData.get("aadharNumber") as string;
        const kycType = formData.get("kycType") as string;

        const request = await AccountRequest.findOne({
            userId,
            currentStatus: { $ne: "Approved" },
        });
        if (!request)
            return NextResponse.json(
                { message: "No active account request found for remediation." },
                { status: 404 },
            );

        const updates: any = {};
        const createKycRecord = async ({
            documentType,
            fileUrl,
            fileName,
            fileType,
            currentStatus,
            documentNumber,
        }: {
            documentType: "PAN" | "Aadhar" | "Signature";
            fileUrl: string;
            fileName: string;
            fileType: "Front" | "Full";
            currentStatus: "Pending" | "Verified";
            documentNumber?: string;
        }) => {
            const referencePrefix =
                documentType === "Aadhar"
                    ? "AADHAR"
                    : documentType.toUpperCase();
            await KYC.create({
                kycReference: `${referencePrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                userId,
                accountRequestId: request._id,
                documentType,
                documentDetails:
                    documentType === "Signature"
                        ? { issuedCountry: "India" }
                        : {
                              encryptedNumber: documentNumber
                                  ? Buffer.from(documentNumber).toString(
                                        "base64",
                                    )
                                  : undefined,
                              numberHash: documentNumber
                                  ? Buffer.from(documentNumber).toString("hex")
                                  : undefined,
                              issuedCountry: "India",
                          },
                attachments: [
                    {
                        fileUrl,
                        fileName,
                        fileType,
                    },
                ],
                currentStatus,
            });
        };

        if (panCard || (kycType === "PAN" && panCard)) {
            const url = await saveFile(panCard, "pan");
            request.kycDocuments.panCardFileUrl = url;
            await createKycRecord({
                documentType: "PAN",
                fileUrl: url,
                fileName: panCard.name,
                fileType: "Front",
                currentStatus: "Pending",
                documentNumber: panNumber,
            });
            updates.pan = "Updated";
        }

        if (aadhar || (kycType === "Aadhar" && aadhar)) {
            const url = await saveFile(aadhar, "aadhar");
            request.kycDocuments.aadharFileUrl = url;
            await createKycRecord({
                documentType: "Aadhar",
                fileUrl: url,
                fileName: aadhar.name,
                fileType: "Front",
                currentStatus: "Pending",
                documentNumber: aadharNumber,
            });
            updates.aadhar = "Updated";
        }

        if (signature || (kycType === "Signature" && signature)) {
            const url = await saveFile(signature, "signature");
            request.kycDocuments.signatureFileUrl = url;
            await createKycRecord({
                documentType: "Signature",
                fileUrl: url,
                fileName: signature.name,
                fileType: "Full",
                currentStatus: "Verified",
            });
            updates.signature = "Updated";
        }

        request.currentStatus = "Pending_KYC";
        await request.save();
        await autoApproveSignatureDocuments(userId);

        return NextResponse.json({
            message: "Documents re-submitted successfully.",
            updates,
        });
    } catch (error: any) {
        console.error("KYC Remediation Error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const userId = decoded.userId;
        const { searchParams } = new URL(req.url);
        const requestId = searchParams.get("id");

        if (!requestId) return NextResponse.json({ message: "Request ID is required" }, { status: 400 });

        const request = await AccountRequest.findOne({ _id: requestId, userId, currentStatus: { $ne: "Approved" } });
        if (!request) return NextResponse.json({ message: "Request not found or cannot be withdrawn" }, { status: 404 });

        await AccountRequest.deleteOne({ _id: requestId });
        await KYC.deleteMany({ accountRequestId: requestId });

        return NextResponse.json({ message: "Account request withdrawn successfully" });
    } catch (error: any) {
        console.error("Withdraw Request Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
