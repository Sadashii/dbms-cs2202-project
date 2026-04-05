import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import ScheduledPayment from "@/models/ScheduledPayments";
import Account from "@/models/Accounts";
import Transaction from "@/models/Transactions";
import Ledger from "@/models/Ledger";
import mongoose from "mongoose";
import crypto from "crypto";

/**
 * Scheduled Payments Cron Job
 *
 * This endpoint should be called by an external cron service (e.g., Vercel Cron,
 * GitHub Actions, or a server-side cron daemon) at regular intervals (e.g., every hour).
 *
 * Security: Protected by a secret key in the Authorization header.
 * Set CRON_SECRET in your .env.local file.
 */
export async function GET(req: Request) {
    // Verify the cron secret to prevent unauthorized triggering
    const reqHeaders = await headers();
    const authHeader = reqHeaders.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const now = new Date();
    const results = { processed: 0, failed: 0, skipped: 0 };

    try {
        // Find all active scheduled payments that are due
        const duePayments = await ScheduledPayment.find({
            currentStatus: "Active",
            nextRunDate: { $lte: now },
        }).limit(100); // Process in batches to avoid timeouts

        for (const schedule of duePayments) {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                const sourceAccount = await Account.findOne({
                    _id: schedule.accountId,
                    currentStatus: "Active",
                }).session(session);

                const destAccount = await Account.findOne({
                    _id: schedule.beneficiaryId,
                    currentStatus: "Active",
                }).session(session);

                if (!sourceAccount || !destAccount) {
                    await session.abortTransaction();
                    schedule.executionHistory.push({
                        attemptedAt: now,
                        status: "Failed",
                        failureReason: "Source or destination account not found or inactive.",
                    });
                    results.failed++;
                } else {
                    const amount = parseFloat(schedule.amount.toString());

                    if (parseFloat(sourceAccount.balance.toString()) < amount) {
                        await session.abortTransaction();
                        schedule.executionHistory.push({
                            attemptedAt: now,
                            status: "Failed",
                            failureReason: "Insufficient funds in source account.",
                        });
                        results.failed++;
                    } else {
                        const referenceId = `SCH-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

                        const [newTransaction] = await Transaction.create(
                            [{ referenceId, type: "Transfer", currency: schedule.currency, currentStatus: "Completed" }],
                            { session }
                        );

                        const updatedSource = await Account.findByIdAndUpdate(
                            sourceAccount._id,
                            { $inc: { balance: -amount } },
                            { new: true, session }
                        );
                        await Ledger.create(
                            [{ transactionId: newTransaction._id, accountId: sourceAccount._id, entryType: "Debit", amount: mongoose.Types.Decimal128.fromString(amount.toFixed(2)), balanceAfter: updatedSource!.balance, memo: schedule.metadata?.description || `Scheduled payment` }],
                            { session }
                        );

                        const updatedDest = await Account.findByIdAndUpdate(
                            destAccount._id,
                            { $inc: { balance: amount } },
                            { new: true, session }
                        );
                        await Ledger.create(
                            [{ transactionId: newTransaction._id, accountId: destAccount._id, entryType: "Credit", amount: mongoose.Types.Decimal128.fromString(amount.toFixed(2)), balanceAfter: updatedDest!.balance, memo: schedule.metadata?.description || `Scheduled payment` }],
                            { session }
                        );

                        await session.commitTransaction();

                        schedule.executionHistory.push({
                            attemptedAt: now,
                            status: "Success",
                            transactionId: newTransaction._id,
                        });
                        results.processed++;
                    }
                }
            } catch (err: any) {
                await session.abortTransaction();
                schedule.executionHistory.push({
                    attemptedAt: now,
                    status: "Failed",
                    failureReason: err.message,
                });
                results.failed++;
            } finally {
                session.endSession();
            }

            // Advance the nextRunDate based on frequency
            if (schedule.frequency !== "Once") {
                const next = new Date(schedule.nextRunDate);
                switch (schedule.frequency) {
                    case "Daily":     next.setDate(next.getDate() + 1); break;
                    case "Weekly":    next.setDate(next.getDate() + 7); break;
                    case "Monthly":   next.setMonth(next.getMonth() + 1); break;
                    case "Quarterly": next.setMonth(next.getMonth() + 3); break;
                    case "Yearly":    next.setFullYear(next.getFullYear() + 1); break;
                }

                // Mark as Completed if past end date
                if (schedule.endDate && next > schedule.endDate) {
                    schedule.currentStatus = "Completed";
                } else {
                    schedule.nextRunDate = next;
                }
            } else {
                schedule.currentStatus = "Completed";
            }

            await schedule.save();
        }

        return NextResponse.json({ message: "Cron run complete.", ...results }, { status: 200 });
    } catch (error: any) {
        console.error("Cron job error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
