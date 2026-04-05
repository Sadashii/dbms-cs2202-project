import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Card from "@/models/Cards";
import Account from "@/models/Accounts";
import Transaction from "@/models/Transactions";
import Ledger from "@/models/Ledger";
import mongoose from "mongoose";
import crypto from "crypto";
import { verifyAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const decoded = verifyAuth(await headers());
        if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const { cardId, accountId, amount } = await req.json();

        if (!cardId || !accountId || !amount || isNaN(amount) || amount <= 0) {
            return NextResponse.json({ message: "Invalid card ID, account ID, or amount." }, { status: 400 });
        }

        const card = await Card.findOne({ _id: cardId, userId: decoded.userId }).session(session);
        if (!card) return NextResponse.json({ message: "Card not found." }, { status: 404 });

        if (card.cardType !== 'Credit') {
            return NextResponse.json({ message: "Repayment only allowed for credit cards." }, { status: 400 });
        }

        const sourceAccount = await Account.findById(accountId).session(session);
        if (!sourceAccount || sourceAccount.userId.toString() !== decoded.userId) {
            return NextResponse.json({ message: "Source account not found or access denied." }, { status: 404 });
        }

        const repaymentAmount = parseFloat(amount);
        const currentOutstanding = parseFloat(card.limits.outstandingAmount?.toString() || "0");

        if (repaymentAmount > currentOutstanding) {
            return NextResponse.json({ message: "Repayment amount exceeds outstanding balance." }, { status: 400 });
        }

        const currentSourceBalance = parseFloat(sourceAccount.balance.toString());
        if (currentSourceBalance < repaymentAmount) {
            return NextResponse.json({ message: "Insufficient funds in source account." }, { status: 400 });
        }

        // Generate Reference ID
        const referenceId = `TXN-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        // Update Card Outstanding Amount
        card.limits.outstandingAmount = mongoose.Types.Decimal128.fromString((currentOutstanding - repaymentAmount).toFixed(2));
        await card.save({ session });

        // Update Source Account Balance (Deduct)
        const updatedSourceAccount = await Account.findByIdAndUpdate(
            sourceAccount._id,
            { $inc: { balance: -repaymentAmount } },
            { new: true, session }
        );

        if (!updatedSourceAccount) throw new Error("Failed to update source account balance.");

        // Create Master Transaction Record
        const newTransaction = await Transaction.create([{
            referenceId,
            type: 'Transfer',
            currency: card.currency,
            currentStatus: 'Completed',
            metadata: { 
                initiatedBy: decoded.userId,
                cardId: card._id,
                accountId: accountId,
                repayment: true
            }
        }], { session });

        // Double-Entry Bookkeeping
        // 1. Debit Source Account
        await Ledger.create([{
            transactionId: newTransaction[0]._id,
            accountId: sourceAccount._id,
            entryType: 'Debit',
            amount: mongoose.Types.Decimal128.fromString(repaymentAmount.toFixed(2)),
            balanceAfter: updatedSourceAccount.balance,
            memo: `Credit Card Repayment (${card.maskedNumber})`
        }], { session });

        // 2. Credit Card 'virtual' ledger for tracking payments
        // We track payments against the card's accountId to show in history
        await Ledger.create([{
            transactionId: newTransaction[0]._id,
            accountId: card.accountId,
            entryType: 'Credit',
            amount: mongoose.Types.Decimal128.fromString(repaymentAmount.toFixed(2)),
            balanceAfter: card.limits.outstandingAmount,
            memo: `Repayment received from ${sourceAccount.accountNumber}`
        }], { session });

        // Log the action
        await createAuditLog({
            userId: decoded.userId,
            userRole: decoded.role,
            actionType: 'CARD_REPAYMENT',
            category: 'Financial',
            severity: 'Low',
            resource: 'Card',
            resourceId: cardId,
            description: `Credit card repayment of ₹${repaymentAmount}`,
            currentStatus: 'Success',
            payload: {
                newState: JSON.stringify({ amount: repaymentAmount, sourceAccount: sourceAccount.accountNumber, referenceId }),
            },
        });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({ message: "Repayment completed successfully.", referenceId }, { status: 200 });

    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        console.error("Card Repayment Error:", error.message);
        return NextResponse.json({ message: error.message || "Repayment failed." }, { status: 400 });
    }
}
