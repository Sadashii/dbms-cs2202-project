import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import AccountRequest from "@/models/AccountRequests";
import KYC from "@/models/KYC";
import Accounts from "@/models/Accounts";
import { verifyAuth } from "@/lib/auth";

export async function PATCH(
    req: NextRequest,
    context: { params: { id: string } }
) {
    try {
        await dbConnect()

        const decoded = verifyAuth(await headers());
        if (!decoded) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Optional but recommended
        if (decoded.role !== "Admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        await dbConnect();

        const { id } = (await context.params); // ✅ safe access
        const body = await req.json();

        if (body.action !== "approve") {
            return NextResponse.json({ message: "Invalid action" }, { status: 400 });
        }

        const accountReq = await AccountRequest.findById(id);
        if (!accountReq) {
            return NextResponse.json({ message: "Request not found" }, { status: 404 });
        }

        if (accountReq.currentStatus === 'Approved') {
            return NextResponse.json({ message: "Account already approved" }, { status: 400 });
        }

        const userKycs = await KYC.find({ userId: accountReq.userId });
        const allVerified = userKycs.length > 0 && userKycs.every(k => k.currentStatus === 'Verified');

        if (!allVerified) {
            return NextResponse.json({
                message: "Cannot approve. All attached KYCs must be verified first."
            }, { status: 403 });
        }

        accountReq.currentStatus = 'Approved';
        await accountReq.save();

        const newAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

        await Accounts.create({
            userId: accountReq.userId,
            accountNumber: newAccountNumber,
            accountType: accountReq.accountType,
            balance: 0,
            currency: "INR",
            currentStatus: "Active",
            branchId: null
        });

        return NextResponse.json({ message: "Account Request Approved and Account Created" }, { status: 200 });

    } catch (error: any) {
        console.error("Error approving request:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}