import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Account from "@/models/Accounts";
import { verifyAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(req: Request) {
    try {
        const reqHeaders = await headers();
        const ip = reqHeaders.get("x-forwarded-for") ?? reqHeaders.get("x-real-ip") ?? "unknown";
        if (!checkRateLimit(ip, "accounts", 100, 15 * 60 * 1000)) {
            return NextResponse.json(
                { message: "Too many requests. Please try again in 15 minutes." },
                { status: 429 },
            );
        }

        const decoded = verifyAuth(reqHeaders);
        if (!decoded) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );
        }

        await dbConnect();

        const url = new URL(req.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
        const limit = Math.min(
            50,
            Math.max(1, parseInt(url.searchParams.get("limit") || "20")),
        );
        const skip = (page - 1) * limit;

        const [accounts, total] = await Promise.all([
            Account.find({ userId: decoded.userId })
                .select(
                    "accountNumber accountType balance currency currentStatus createdAt",
                )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Account.countDocuments({ userId: decoded.userId }),
        ]);

        const formattedAccounts = accounts.map((acc) => ({
            ...acc,
            balance: acc.balance ? parseFloat(acc.balance.toString()) : 0.0,
        }));

        return NextResponse.json(
            {
                accounts: formattedAccounts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page * limit < total,
                    hasPrevPage: page > 1,
                },
            },
            { status: 200 },
        );
    } catch (error: any) {
        console.error("Accounts Fetch Error:", error);
        return NextResponse.json(
            { message: "Internal server error." },
            { status: 500 },
        );
    }
}
