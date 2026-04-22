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
import { checkRateLimit } from "@/lib/rateLimit";

const TransferSchema = z.object({
    fromAccountId: z.string().min(1, "Source account is required"),
    toAccountNumber: z.string().min(1, "Recipient account number is required"),
    amount: z
        .number({ message: "Amount must be a number" })
        .positive("Amount must be greater than zero")
        .max(10_000_000, "Amount exceeds maximum transfer limit"),
    memo: z.string().max(200, "Memo is too long").optional(),
});

export async function POST(req: Request) {
    const reqHeaders = await headers();
    const ip = reqHeaders.get("x-forwarded-for") ?? reqHeaders.get("x-real-ip") ?? "unknown";
    if (!checkRateLimit(ip, "transactions", 20, 60 * 60 * 1000)) {
        return NextResponse.json(
            { message: "Too many transactions. Please try again in an hour." },
            { status: 429 },
        );
    }

    const decoded = verifyAuth(reqHeaders);
    if (!decoded)
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const rawBody = await req.json();
        const parseResult = TransferSchema.safeParse(rawBody);
        if (!parseResult.success) {
            return NextResponse.json(
                { message: parseResult.error.issues[0].message },
                { status: 400 },
            );
        }
        const {
            fromAccountId,
            toAccountNumber,
            amount: transferAmount,
            memo,
        } = parseResult.data;

        const senderAccount = await Account.findOne({
            _id: fromAccountId,
            userId: decoded.userId,
            currentStatus: "Active",
        }).session(session);

        if (!senderAccount)
            throw new Error("Sender account not found or inactive.");
        if (parseFloat(senderAccount.balance.toString()) < transferAmount) {
            throw new Error("Insufficient funds.");
        }

        const receiverAccount = await Account.findOne({
            accountNumber: toAccountNumber,
            currentStatus: "Active",
        }).session(session);

        if (!receiverAccount)
            throw new Error("Receiver account not found or inactive.");

        const referenceId = `TXN-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

        const newTransaction = await Transaction.create(
            [
                {
                    referenceId,
                    type: "Transfer",
                    currency: senderAccount.currency,
                    currentStatus: "Completed",
                    metadata: { initiatedBy: decoded.userId },
                },
            ],
            { session },
        );

        const updatedSender = await Account.findByIdAndUpdate(
            senderAccount._id,
            { $inc: { balance: -transferAmount } },
            { new: true, session },
        );

        await Ledger.create(
            [
                {
                    transactionId: newTransaction[0]._id,
                    accountId: senderAccount._id,
                    entryType: "Debit",
                    amount: mongoose.Types.Decimal128.fromString(
                        transferAmount.toFixed(2),
                    ),
                    balanceAfter: updatedSender!.balance,
                    memo: memo || `Transfer to ${toAccountNumber}`,
                },
            ],
            { session },
        );

        const updatedReceiver = await Account.findByIdAndUpdate(
            receiverAccount._id,
            { $inc: { balance: transferAmount } },
            { new: true, session },
        );

        await Ledger.create(
            [
                {
                    transactionId: newTransaction[0]._id,
                    accountId: receiverAccount._id,
                    entryType: "Credit",
                    amount: mongoose.Types.Decimal128.fromString(
                        transferAmount.toFixed(2),
                    ),
                    balanceAfter: updatedReceiver!.balance,
                    memo:
                        memo || `Transfer from ${senderAccount.accountNumber}`,
                },
            ],
            { session },
        );

        await session.commitTransaction();

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

        return NextResponse.json(
            {
                message: "Transfer completed successfully.",
                referenceId,
                newBalance: parseFloat(updatedSender!.balance.toString()),
            },
            { status: 200 },
        );
    } catch (error: any) {
        await session.abortTransaction();

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

        const userFriendlyMessage =
            error.message.includes("Insufficient") ||
            error.message.includes("account")
                ? error.message
                : "Transaction failed due to an internal error. Please try again.";

        return NextResponse.json(
            { message: userFriendlyMessage },
            { status: 400 },
        );
    } finally {
        session.endSession();
    }
}
