import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import Transaction from "@/models/Transactions";
import Account from "@/models/Accounts";
import Ledger from "@/models/Ledger";

// Replace with your Payment Gateway's webhook signing secret
const WEBHOOK_SECRET = process.env.GATEWAY_WEBHOOK_SECRET || "whsec_test_secret";

export async function POST(req: Request) {
    try {
        const rawBody = await req.text(); // Must read as raw text for signature verification
        const signature = headers().get("x-webhook-signature"); // e.g., Stripe-Signature or Razorpay-Signature

        if (!signature) {
            return NextResponse.json({ message: "Missing signature" }, { status: 401 });
        }

        // 1. Verify Webhook Signature (Standard HMAC SHA256)
        const expectedSignature = crypto
            .createHmac("sha256", WEBHOOK_SECRET)
            .update(rawBody)
            .digest("hex");

        // Use timingSafeEqual to prevent timing attacks
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
        }

        // 2. Parse payload safely
        const payload = JSON.parse(rawBody);
        const eventType = payload.event;
        const referenceId = payload.data.transactionReference; // Custom ID you passed to the gateway

        await dbConnect();

        // 3. Find the pending transaction
        const pendingTxn = await Transaction.findOne({ 
            referenceId: referenceId,
            currentStatus: 'Pending'
        });

        if (!pendingTxn) {
            // Already processed or doesn't exist (Idempotent success return)
            return NextResponse.json({ received: true }, { status: 200 });
        }

        // 4. Handle successful external deposit
        if (eventType === "payment.captured" || eventType === "charge.succeeded") {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                // Update transaction status
                pendingTxn.currentStatus = 'Completed';
                pendingTxn.statusHistory.push({ state: 'Completed', updatedAt: new Date() });
                await pendingTxn.save({ session });

                // Find the target account linked in your metadata
                const targetAccountId = pendingTxn.metadata?.initiatedBy; // Assuming metadata holds the destination
                const amountCaptured = parseFloat(payload.data.amount) / 100; // Assuming gateway sends in cents/paise

                // Update Account Balance
                const updatedAccount = await Account.findByIdAndUpdate(
                    targetAccountId,
                    { $inc: { balance: amountCaptured } },
                    { new: true, session }
                );

                // Create Ledger Credit
                await Ledger.create([{
                    transactionId: pendingTxn._id,
                    accountId: updatedAccount!._id,
                    entryType: 'Credit',
                    amount: mongoose.Types.Decimal128.fromString(amountCaptured.toFixed(2)),
                    balanceAfter: updatedAccount!.balance,
                    memo: `External Deposit via ${payload.gateway || 'Card'}`
                }], { session });

                await session.commitTransaction();
                session.endSession();
                
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                throw error;
            }
        } 
        
        // 5. Handle failed payments
        else if (eventType === "payment.failed") {
            pendingTxn.currentStatus = 'Failed';
            pendingTxn.metadata = { 
                ...pendingTxn.metadata, 
                failureReason: payload.data.failure_reason || "Gateway declined" 
            };
            pendingTxn.statusHistory.push({ state: 'Failed', updatedAt: new Date() });
            await pendingTxn.save();
        }

        // Respond with 200 OK so the gateway knows we received it and doesn't retry
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error: any) {
        console.error("Webhook Error:", error);
        // Do not leak error details to the gateway
        return NextResponse.json({ message: "Webhook handler failed" }, { status: 500 });
    }
}