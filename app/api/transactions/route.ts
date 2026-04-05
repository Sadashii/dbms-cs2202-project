import { NextResponse } from "next/server";
import { headers } from "next/headers";
import mongoose from "mongoose";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Account from "@/models/Accounts";
import Transaction from "@/models/Transactions";
import Ledger from "@/models/Ledger";
import { verifyAuth } from "@/lib/auth";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";

const TransferSchema = z.object({
    fromAccountId: z.string().min(1, "Source account is required"),
    toAccountNumber: z.string().min(1, "Recipient account number is required"),
    amount: z.number({ message: "Amount must be a number" }).positive("Amount must be greater than zero").max(10_000_000, "Amount exceeds maximum transfer limit"),
    memo: z.string().max(200, "Memo is too long").optional(),
});

export async function POST(req: Request) {
    const decoded = verifyAuth(await headers());
    if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Establish DB connection BEFORE starting a session
    await dbConnect();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const rawBody = await req.json();
        const parseResult = TransferSchema.safeParse(rawBody);
        if (!parseResult.success) {
            return NextResponse.json(
                { message: parseResult.error.issues[0].message },
                { status: 400 }
            );
        }
        const { fromAccountId, toAccountNumber, amount: transferAmount, memo } = parseResult.data;

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

        // Log successful transaction
        await createAuditLog({
            userId: decoded.userId,
            userRole: decoded.role,
            actionType: "TRANSACTION_COMPLETED",
            category: "Financial",
            severity: "Medium",
            resource: "Transaction",
            resourceId: newTransaction[0]._id,
            description: `Sent ₹${transferAmount} to ${toAccountNumber}`,
            currentStatus: "Success",
            payload: {
                newState: JSON.stringify({
                    referenceId: newTransaction[0].referenceId,
                    amount: transferAmount,
                    currency: senderAccount.currency,
                }),
            },
        });

        return NextResponse.json({ 
            message: "Transfer completed successfully.", 
            referenceId,
            newBalance: parseFloat(updatedSender!.balance.toString())
        }, { status: 200 });

    } catch (error: any) {
        // IF ANYTHING FAILS, ROLLBACK ALL CHANGES
        await session.abortTransaction();
        
        // Log failed transaction attempt
        await createAuditLog({
            userId: decoded.userId,
            userRole: decoded.role,
            actionType: "TRANSACTION_FAILED",
            category: "Financial",
            severity: "High",
            resource: "Transaction",
            description: `Failed transaction to ${error.message}`,
            currentStatus: "Failure",
            payload: {
                previousState: JSON.stringify({ amount: error.message }),
            },
        });

        console.error("Transaction Error:", error.message);
        
        // Don't expose deep database errors to the frontend
        const userFriendlyMessage = error.message.includes("Insufficient") || error.message.includes("account") 
            ? error.message 
            : "Transaction failed due to an internal error. Please try again.";

        return NextResponse.json({ message: userFriendlyMessage }, { status: 400 });
    } finally {
        session.endSession();
    }
}