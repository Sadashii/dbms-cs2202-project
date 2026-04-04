import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Account from "@/models/Accounts";
import jwt from "jsonwebtoken";

// Helper function to verify auth token
const verifyAuth = (reqHeaders: Headers) => {
    const authHeader = reqHeaders.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    try {
        const token = authHeader.split(" ")[1];
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string, role: string };
    } catch (error) {
        return null;
    }
};

export async function GET(req: Request) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Fetch accounts belonging to the authenticated user
        // Using .select() to avoid sending unnecessary heavy data to the frontend
        const accounts = await Account.find({ userId: decoded.userId })
            .select("accountNumber accountType balance currency currentStatus createdAt")
            .lean();

        // Convert Decimal128 to standard numbers/strings for JSON serialization
        const formattedAccounts = accounts.map(acc => ({
            ...acc,
            balance: acc.balance ? parseFloat(acc.balance.toString()) : 0.00
        }));

        return NextResponse.json({ accounts: formattedAccounts }, { status: 200 });

    } catch (error: any) {
        console.error("Accounts Fetch Error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}