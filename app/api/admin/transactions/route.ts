import { NextResponse } from "next/server";
import { headers } from "next/headers";
import mongoose from "mongoose";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Account from "@/models/Accounts";
import Transaction from "@/models/Transactions";
import Ledger from "@/models/Ledger";
import { verifyAuth } from "@/lib/auth";

export async function POST(req: Request) {
    const decoded = verifyAuth(await headers());
    if (!decoded)
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const allowedRoles = ["Employee", "Manager", "Admin"];
    if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.json(
            { message: "Forbidden. Insufficient permissions." },
            { status: 403 },
        );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await dbConnect();
        const body = await req.json();
        const { action, accountNumber, amount, memo } = body;

        if (action !== "deposit" && action !== "withdrawal") {
            throw new Error(
                "Invalid action. Must be 'deposit' or 'withdrawal'.",
            );
        }

        const transactionAmount = parseFloat(amount);
        if (isNaN(transactionAmount) || transactionAmount <= 0) {
            throw new Error("Invalid transfer amount.");
        }

        const account = await Account.findOne({
            accountNumber,
            currentStatus: "Active",
        }).session(session);

        if (!account) {
            throw new Error("Account not found or is currently inactive.");
        }

        if (action === "withdrawal") {
            const currentBalance = parseFloat(account.balance.toString());
            if (currentBalance < transactionAmount) {
                throw new Error(
                    "Insufficient funds. Overdrafting is not allowed.",
                );
            }
        }

        const referenceId = `TXN-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

        const transactionType = action === "deposit" ? "Deposit" : "Withdrawal";

        const newTransaction = await Transaction.create(
            [
                {
                    referenceId,
                    type: transactionType,
                    currency: account.currency,
                    currentStatus: "Completed",
                    metadata: {
                        initiatedBy: new mongoose.Types.ObjectId(
                            decoded.userId,
                        ),
                    },
                },
            ],
            { session },
        );

        const balanceChange =
            action === "deposit" ? transactionAmount : -transactionAmount;
        const entryType = action === "deposit" ? "Credit" : "Debit";

        const updatedAccount = await Account.findByIdAndUpdate(
            account._id,
            { $inc: { balance: balanceChange } },
            { new: true, session },
        );

        if (!updatedAccount) {
            throw new Error("Failed to update account balance.");
        }

        await Ledger.create(
            [
                {
                    transactionId: newTransaction[0]._id,
                    accountId: account._id,
                    entryType: entryType,
                    amount: mongoose.Types.Decimal128.fromString(
                        transactionAmount.toFixed(2),
                    ),
                    balanceAfter: updatedAccount.balance,
                    memo: memo || `Admin ${action}`,
                },
            ],
            { session },
        );

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json(
            {
                message: `${transactionType} completed successfully.`,
                referenceId,
                newBalance: parseFloat(updatedAccount.balance.toString()),
                accountNumber,
            },
            { status: 200 },
        );
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        console.error("Admin Transaction Error:", error.message);

        const isClientError =
            error.message.includes("Account not found") ||
            error.message.includes("Insufficient funds") ||
            error.message.includes("Invalid action") ||
            error.message.includes("Invalid transfer amount");

        const userFriendlyMessage = isClientError
            ? error.message
            : "Transaction failed due to an internal error. Please try again.";

        return NextResponse.json(
            { message: userFriendlyMessage },
            { status: 400 },
        );
    }
}
