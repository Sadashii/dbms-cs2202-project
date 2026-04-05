import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Card from "@/models/Cards";
import Transaction from "@/models/Transactions";
import Ledger from "@/models/Ledger";
import { verifyAuth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const decoded = verifyAuth(await headers());
        if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await dbConnect();

        const card = await Card.findOne({ _id: id, userId: decoded.userId });
        if (!card) return NextResponse.json({ message: "Card not found." }, { status: 404 });

        // We fetch transactions from Ledger that are linked to Transactions where metadata.cardId matches.
        const cardTransactions = await Transaction.find({ 
            "metadata.cardId": card._id 
        }).sort({ createdAt: -1 }).limit(20).lean();

        const txnIds = cardTransactions.map(t => t._id);
        
        const ledgerEntries = await Ledger.find({ 
            transactionId: { $in: txnIds },
            accountId: card.accountId 
        }).sort({ createdAt: -1 }).lean();

        // Map entries back to transactions for better detail
        const transactions = ledgerEntries.map((entry: any) => {
            const txn = cardTransactions.find(t => t._id.toString() === entry.transactionId.toString());
            return {
                ...entry,
                transaction: txn,
                amount: parseFloat(entry.amount?.toString() || "0"),
                balanceAfter: parseFloat(entry.balanceAfter?.toString() || "0")
            };
        });

        return NextResponse.json({ transactions }, { status: 200 });

    } catch (error: any) {
        console.error("Card Transactions GET Error:", error.message);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
