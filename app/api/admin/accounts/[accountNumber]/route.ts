import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Account from "@/models/Accounts";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ accountNumber: string }> }) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const allowedRoles = ["Employee", "Manager", "Admin"];
        if (!allowedRoles.includes(decoded.role)) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const accountNumber = (await params).accountNumber;
        if (!accountNumber) {
            return NextResponse.json({ message: "Account number is required" }, { status: 400 });
        }

        await dbConnect();

        const account = await Account.findOne({ accountNumber })
            .populate('userId', 'firstName lastName email phoneNumber')
            .lean();

        if (!account) {
            return NextResponse.json({ message: "Account not found" }, { status: 404 });
        }

        const formattedAccount = {
            ...account,
            balance: account.balance ? parseFloat(account.balance.toString()) : 0.00
        };

        return NextResponse.json({ account: formattedAccount }, { status: 200 });
    } catch (error: any) {
        console.error("Admin fetch account error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
