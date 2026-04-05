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
        const { cardId, amount, merchant, isOnline = false, isInternational = false, isContactless = false, isATM = false } = await req.json();

        if (!cardId || !amount || isNaN(amount) || amount <= 0) {
            return NextResponse.json({ message: "Invalid card ID or amount." }, { status: 400 });
        }

        const card = await Card.findOne({ _id: cardId, userId: decoded.userId }).session(session);
        if (!card) return NextResponse.json({ message: "Card not found." }, { status: 404 });

        if (card.currentStatus !== 'Active') {
            return NextResponse.json({ message: `Card is ${card.currentStatus.toLowerCase()} and cannot be used.` }, { status: 400 });
        }

        // Feature & Limit Checks
        if (isOnline && !card.isOnlineEnabled) return NextResponse.json({ message: "Online transactions are disabled." }, { status: 400 });
        if (isInternational && !card.isInternationalEnabled) return NextResponse.json({ message: "International usage is disabled." }, { status: 400 });
        
        if (isContactless && amount > parseFloat(card.limits.contactlessLimit.toString())) {
            return NextResponse.json({ message: `Amount exceeds contactless limit of ₹${parseFloat(card.limits.contactlessLimit.toString()).toLocaleString()}.` }, { status: 400 });
        }

        // Daily Limit Logic (Online & ATM)
        if (isOnline || isATM) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            // Fetch transaction IDs from today with requested metadata
            const searchMetadata: any = { cardId: card._id };
            if (isOnline) searchMetadata.isOnline = true;
            if (isATM) searchMetadata.isATM = true;

            const todayTxns = await Transaction.find({
                "metadata.cardId": card._id,
                "metadata.isOnline": isOnline ? true : { $exists: true }, // Filter more broadly if needed
                createdAt: { $gte: startOfDay },
                currentStatus: 'Completed'
            }).lean();

            // Refine local list to match specific channel
            const filteredTxns = todayTxns.filter((t: any) => {
                if (isOnline && t.metadata?.isOnline) return true;
                if (isATM && t.metadata?.isATM) return true;
                return false;
            });

            const txnIds = filteredTxns.map(t => t._id);
            const ledgerEntries = await Ledger.find({
                transactionId: { $in: txnIds },
                accountId: card.accountId
            }).lean();

            const spentToday = ledgerEntries.reduce((sum, entry) => sum + Math.abs(parseFloat(entry.amount?.toString() || "0")), 0);
            const limit = isOnline ? parseFloat(card.limits.dailyOnlineLimit.toString()) : parseFloat(card.limits.dailyWithdrawalLimit.toString());
            const limitName = isOnline ? "Online" : "ATM";

            if (spentToday + amount > limit) {
                return NextResponse.json({ message: `Daily ${limitName} limit reached. Remaining: ₹${(limit - spentToday).toLocaleString()}` }, { status: 400 });
            }
        }

        const transactionAmount = parseFloat(amount);
        const referenceId = `TXN-CARD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // Create Transaction Record First (outside conditionals but still in session)
        const newTransaction = await Transaction.create([{
            referenceId,
            type: 'Withdrawal',
            currency: card.currency,
            currentStatus: 'Completed',
            metadata: { 
                initiatedBy: decoded.userId,
                cardId: card._id,
                merchant: merchant || (isATM ? "ATM Machine" : "Merchant"),
                isOnline,
                isInternational,
                isContactless,
                isATM
            }
        }], { session });

        if (card.cardType === 'Credit') {
            const currentOutstanding = parseFloat(card.limits.outstandingAmount?.toString() || "0");
            const creditLimit = parseFloat(card.limits.creditLimit?.toString() || "0");

            if (currentOutstanding + transactionAmount > creditLimit) {
                throw new Error("Credit limit exceeded.");
            }

            card.limits.outstandingAmount = mongoose.Types.Decimal128.fromString((currentOutstanding + transactionAmount).toFixed(2));
            await card.save({ session });

            await Ledger.create([{
                transactionId: newTransaction[0]._id,
                accountId: card.accountId,
                entryType: 'Debit',
                amount: mongoose.Types.Decimal128.fromString((-transactionAmount).toFixed(2)),
                balanceAfter: card.limits.outstandingAmount,
                memo: `${card.cardType} Expense: ${merchant || (isATM ? "ATM Withdrawal" : "Card Transaction")}`
            }], { session });

        } else {
            const account = await Account.findById(card.accountId).session(session);
            if (!account) throw new Error("Linked account not found.");
            if (parseFloat(account.balance.toString()) < transactionAmount) throw new Error("Insufficient funds in linked account.");

            const updatedAccount = await Account.findByIdAndUpdate(
                account._id,
                { $inc: { balance: -transactionAmount } },
                { new: true, session }
            );

            if (!updatedAccount) throw new Error("Failed to update account balance.");

            await Ledger.create([{
                transactionId: newTransaction[0]._id,
                accountId: account._id,
                entryType: 'Debit',
                amount: mongoose.Types.Decimal128.fromString((-transactionAmount).toFixed(2)),
                balanceAfter: updatedAccount.balance,
                memo: `${isATM ? 'ATM Withdrawal' : 'Card Expense'} at ${merchant || "Merchant"}`
            }], { session });
        }

        // Log the action (After logic complete)
        await createAuditLog({
            userId: decoded.userId,
            userRole: decoded.role,
            actionType: 'CARD_EXPENSE',
            category: 'Financial',
            severity: 'Low',
            resource: 'Card',
            resourceId: cardId,
            description: `Simulated expense of ₹${transactionAmount} (${isOnline?'Online':isATM?'ATM':isContactless?'Contactless':'POS'})`,
            currentStatus: 'Success',
            payload: {
                newState: JSON.stringify({ amount: transactionAmount, merchant, referenceId }),
            },
        });

        await session.commitTransaction();
        return NextResponse.json({ message: "Expense simulated successfully.", referenceId }, { status: 200 });

    } catch (error: any) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error("Card Expense Error:", error.message);
        return NextResponse.json({ message: error.message || "Failed to process expense." }, { status: 400 });
    } finally {
        session.endSession();
    }
}
