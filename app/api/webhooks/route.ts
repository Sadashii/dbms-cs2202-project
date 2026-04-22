import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import Transaction from "@/models/Transactions";
import Account from "@/models/Accounts";
import Ledger from "@/models/Ledger";

const WEBHOOK_SECRET =
    process.env.GATEWAY_WEBHOOK_SECRET || "whsec_test_secret";

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const signature = (await headers()).get("x-webhook-signature");

        if (!signature) {
            return NextResponse.json(
                { message: "Missing signature" },
                { status: 401 },
            );
        }

        const expectedSignature = crypto
            .createHmac("sha256", WEBHOOK_SECRET)
            .update(rawBody)
            .digest("hex");

        if (
            !crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature),
            )
        ) {
            return NextResponse.json(
                { message: "Invalid signature" },
                { status: 401 },
            );
        }

        const payload = JSON.parse(rawBody);
        const eventType = payload.event;
        const referenceId = payload.data.transactionReference;

        await dbConnect();

        const pendingTxn = await Transaction.findOne({
            referenceId: referenceId,
            currentStatus: "Pending",
        });

        if (!pendingTxn) {
            return NextResponse.json({ received: true }, { status: 200 });
        }

        if (
            eventType === "payment.captured" ||
            eventType === "charge.succeeded"
        ) {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                pendingTxn.currentStatus = "Completed";
                pendingTxn.statusHistory.push({
                    state: "Completed",
                    updatedAt: new Date(),
                });
                await pendingTxn.save({ session });

                const targetAccountId = pendingTxn.metadata?.initiatedBy;
                const amountCaptured = parseFloat(payload.data.amount) / 100;

                const updatedAccount = await Account.findByIdAndUpdate(
                    targetAccountId,
                    { $inc: { balance: amountCaptured } },
                    { new: true, session },
                );

                await Ledger.create(
                    [
                        {
                            transactionId: pendingTxn._id,
                            accountId: updatedAccount!._id,
                            entryType: "Credit",
                            amount: mongoose.Types.Decimal128.fromString(
                                amountCaptured.toFixed(2),
                            ),
                            balanceAfter: updatedAccount!.balance,
                            memo: `External Deposit via ${payload.gateway || "Card"}`,
                        },
                    ],
                    { session },
                );

                await session.commitTransaction();
                session.endSession();
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                throw error;
            }
        } else if (eventType === "payment.failed") {
            pendingTxn.currentStatus = "Failed";
            pendingTxn.metadata = {
                ...pendingTxn.metadata,
                failureReason:
                    payload.data.failure_reason || "Gateway declined",
            };
            pendingTxn.statusHistory.push({
                state: "Failed",
                updatedAt: new Date(),
            });
            await pendingTxn.save();
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error: any) {
        console.error("Webhook Error:", error);

        return NextResponse.json(
            { message: "Webhook handler failed" },
            { status: 500 },
        );
    }
}
