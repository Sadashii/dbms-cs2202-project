import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import AccountRequest from "@/models/AccountRequests";
import Accounts from "@/models/Accounts";
import { verifyAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import {
    autoApproveSignatureDocuments,
    getLatestKycDocumentsForRequest,
} from "@/lib/kycWorkflow";

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        await dbConnect();

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

        const { id } = await context.params;
        const body = await req.json();

        const accountReq = await AccountRequest.findById(id);
        if (!accountReq) {
            return NextResponse.json(
                { message: "Request not found" },
                { status: 404 },
            );
        }

        if (body.action === "reject") {
            accountReq.currentStatus = "Rejected";
            accountReq.metadata = {
                ...accountReq.metadata,
                rejectionReason:
                    body.reason || "Documents do not meet requirements.",
                reviewedBy: decoded.userId,
            };
            await accountReq.save();

            await createAuditLog({
                userId: decoded.userId,
                userRole: decoded.role,
                actionType: "ACCOUNT_REJECTED",
                category: "Administrative",
                severity: "Medium",
                resource: "AccountRequest",
                resourceId: accountReq._id,
                description: `Account request for user ${accountReq.userId} was rejected. Reason: ${body.reason || "N/A"}`,
                currentStatus: "Success",
            });

            return NextResponse.json(
                { message: "Account Request Rejected" },
                { status: 200 },
            );
        }

        if (body.action !== "approve") {
            return NextResponse.json(
                { message: "Invalid action" },
                { status: 400 },
            );
        }

        if (accountReq.currentStatus === "Approved") {
            return NextResponse.json(
                { message: "Account already approved" },
                { status: 400 },
            );
        }

        await autoApproveSignatureDocuments(String(accountReq.userId));

        const latestDocuments = await getLatestKycDocumentsForRequest({
            _id: accountReq._id,
            userId: accountReq.userId,
            kycDocuments: accountReq.kycDocuments,
        });

        const requiredDocs = ["PAN", "Aadhar", "Signature"];
        const foundDocs = latestDocuments.filter((k) =>
            k?.documentType && requiredDocs.includes(k.documentType),
        );

        const allVerified =
            foundDocs.length === requiredDocs.length &&
            foundDocs.every((k) => k?.currentStatus === "Verified");
        const anyRejected = foundDocs.some(
            (k) => k?.currentStatus === "Rejected",
        );

        if (anyRejected) {
            return NextResponse.json(
                {
                    message:
                        "Cannot approve. One or more KYC documents are currently Rejected. User must re-upload.",
                },
                { status: 403 },
            );
        }

        if (!allVerified) {
            return NextResponse.json(
                {
                    message:
                        "Cannot approve. All mandatory KYC documents (PAN, Aadhar, Signature) must be Verified first.",
                },
                { status: 403 },
            );
        }

        accountReq.currentStatus = "Approved";
        await accountReq.save();

        const newAccountNumber = Math.floor(
            1000000000 + Math.random() * 9000000000,
        ).toString();

        const newAccount = await Accounts.create({
            userId: accountReq.userId,
            accountNumber: newAccountNumber,
            accountType: accountReq.accountType,
            balance: 0,
            currency: "INR",
            currentStatus: "Active",
            branchId: accountReq.branchId || null,
        });

        await createAuditLog({
            userId: decoded.userId,
            userRole: decoded.role,
            actionType: "ACCOUNT_CREATED",
            category: "Administrative",
            severity: "Medium",
            resource: "Account",
            resourceId: newAccount._id,
            description: `New ${accountReq.accountType} account created for user ${accountReq.userId}`,
            currentStatus: "Success",
            payload: {
                newState: JSON.stringify({
                    accountNumber: newAccountNumber,
                    accountType: accountReq.accountType,
                    userId: accountReq.userId,
                }),
            },
        });

        return NextResponse.json(
            { message: "Account Request Approved and Account Created" },
            { status: 200 },
        );
    } catch (error: unknown) {
        console.error("Error approving request:", error);
        return NextResponse.json(
            { message: getErrorMessage(error, "Internal server error") },
            { status: 500 },
        );
    }
}
