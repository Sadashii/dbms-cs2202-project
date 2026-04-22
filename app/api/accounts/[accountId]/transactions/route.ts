import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Account from "@/models/Accounts";
import Ledger from "@/models/Ledger";
import Transaction from "@/models/Transactions";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ accountId: string }> },
) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );
        }

        await dbConnect();
        Transaction.init();

        const { accountId } = await params;

        const url = new URL(req.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
        const limit = Math.min(
            100,
            Math.max(1, parseInt(url.searchParams.get("limit") || "20")),
        );
        const skip = (page - 1) * limit;
        const entryType = url.searchParams.get("type");
        const startDate = url.searchParams.get("start");
        const endDate = url.searchParams.get("end");

        const account = await Account.findOne({
            _id: accountId,
            userId: decoded.userId,
        });
        if (!account) {
            return NextResponse.json(
                { message: "Account not found or unauthorized." },
                { status: 404 },
            );
        }

        const filter: Record<string, any> = { accountId: account._id };
        if (entryType === "Credit" || entryType === "Debit") {
            filter.entryType = entryType;
        }
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const [ledgers, total] = await Promise.all([
            Ledger.find(filter)
                .populate("transactionId", "referenceId type currentStatus")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Ledger.countDocuments(filter),
        ]);

        const formattedLedgers = ledgers.map((l: any) => ({
            ...l,
            amount: l.amount ? parseFloat(l.amount.toString()) : 0,
            balanceAfter: l.balanceAfter
                ? parseFloat(l.balanceAfter.toString())
                : 0,
        }));

        return NextResponse.json(
            {
                account: {
                    accountType: account.accountType,
                    accountNumber: account.accountNumber,
                    currency: account.currency,
                    balance: parseFloat(account.balance.toString()),
                },
                transactions: formattedLedgers,
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
        console.error("Ledger Fetch Error:", error);
        return NextResponse.json(
            { message: "Internal server error." },
            { status: 500 },
        );
    }
}
