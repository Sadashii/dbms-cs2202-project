import { NextResponse } from "next/server";
import { headers } from "next/headers";
import mongoose from "mongoose";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Account from "@/models/Accounts";
import Transaction from "@/models/Transactions";
import Ledger from "@/models/Ledger";
import jwt from "jsonwebtoken";

const verifyAuth = (reqHeaders: Headers) => {
    const authHeader = reqHeaders.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    try {
        return jwt.verify(authHeader.split(" ")[1], process.env.JWT_ACCESS_SECRET!) as { userId: string, role: string };
    } catch (error) {
        return null;
    }
};

export async function POST(req: Request) {
    const decoded = verifyAuth(await headers());
    if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await dbConnect();
        const body = await req.json();
        const { fromAccountId, toAccountNumber, amount, memo } = body;

        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            throw new Error("Invalid transfer amount.");
        }

        // 1. Fetch Sender Account & Lock it for the duration of the transaction
        const senderAccount = await Account.findOne({ 
            _id: fromAccountId, 
            userId: decoded.userId, // Ensure the sender actually owns this account
            currentStatus: 'Active' 
        }).session(session);

        if (!senderAccount) throw new Error("Sender account not found or inactive.");
        if (parseFloat(senderAccount.balance.toString()) < transferAmount) {
            throw new Error("Insufficient funds.");
        }

        // 2. Fetch Receiver Account
        const receiverAccount = await Account.findOne({ 
            accountNumber: toAccountNumber,
            currentStatus: 'Active'
        }).session(session);

        if (!receiverAccount) throw new Error("Receiver account not found or inactive.");

        // Generate Idempotency Key / Reference ID
        const referenceId = `TXN-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        // 3. Create Master Transaction Record
        const newTransaction = await Transaction.create([{
            referenceId,
            type: 'Transfer',
            currency: senderAccount.currency,
            currentStatus: 'Completed',
            metadata: { initiatedBy: decoded.userId }
        }], { session });

        // 4. Double-Entry Bookkeeping: Debit Sender
        // We use native MongoDB $inc which is thread-safe and mathematically accurate for Decimal128
        const updatedSender = await Account.findByIdAndUpdate(
            senderAccount._id,
            { $inc: { balance: -transferAmount } },
            { new: true, session }
        );

        await Ledger.create([{
            transactionId: newTransaction[0]._id,
            accountId: senderAccount._id,
            entryType: 'Debit',
            amount: mongoose.Types.Decimal128.fromString(transferAmount.toFixed(2)),
            balanceAfter: updatedSender!.balance,
            memo: memo || `Transfer to ${toAccountNumber}`
        }], { session });

        // 5. Double-Entry Bookkeeping: Credit Receiver
        const updatedReceiver = await Account.findByIdAndUpdate(
            receiverAccount._id,
            { $inc: { balance: transferAmount } },
            { new: true, session }
        );

        await Ledger.create([{
            transactionId: newTransaction[0]._id,
            accountId: receiverAccount._id,
            entryType: 'Credit',
            amount: mongoose.Types.Decimal128.fromString(transferAmount.toFixed(2)),
            balanceAfter: updatedReceiver!.balance,
            memo: memo || `Transfer from ${senderAccount.accountNumber}`
        }], { session });

        // 6. Commit Transaction (Everything is saved to DB permanently)
        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({ 
            message: "Transfer completed successfully.", 
            referenceId,
            newBalance: parseFloat(updatedSender!.balance.toString())
        }, { status: 200 });

    } catch (error: any) {
        // IF ANYTHING FAILS, ROLLBACK ALL CHANGES
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction Error:", error.message);
        
        // Don't expose deep database errors to the frontend
        const userFriendlyMessage = error.message.includes("Insufficient") || error.message.includes("account") 
            ? error.message 
            : "Transaction failed due to an internal error. Please try again.";

        return NextResponse.json({ message: userFriendlyMessage }, { status: 400 });
    }
}