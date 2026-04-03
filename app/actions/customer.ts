"use server";

import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Transaction from "@/lib/models/Transaction";
import { getAuthPayload } from "@/lib/auth";
import { generateTransactionId } from "@/lib/utils";
import mongoose from "mongoose";

/**
 * Transfer funds from the authenticated customer to another account.
 */
export async function transferFunds(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const recipientAccountNumber = (formData.get("accountNumber") as string | null)?.trim();
  const amountStr = (formData.get("amount") as string | null)?.trim();

  if (!recipientAccountNumber || !amountStr) return "All fields are required.";

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return "Amount must be a positive number.";

  const payload = await getAuthPayload();
  if (!payload || payload.role !== "CUSTOMER") return "Unauthorized.";

  await connectDB();
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const sender = await User.findById(payload.userId).session(session);
    if (!sender) throw new Error("Sender account not found.");
    if (sender.balance < amount) throw new Error("Insufficient funds.");

    const receiver = await User.findOne({ accountNumber: recipientAccountNumber }).session(session);
    if (!receiver) throw new Error("Recipient account not found.");
    if (sender._id.equals(receiver._id)) throw new Error("Cannot transfer to yourself.");

    sender.balance -= amount;
    receiver.balance += amount;
    await sender.save({ session });
    await receiver.save({ session });

    await Transaction.create(
      [
        {
          transactionId: generateTransactionId(),
          type: "TRANSFER",
          amount,
          senderId: sender._id,
          receiverId: receiver._id,
          status: "COMPLETED",
          timestamp: new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return null;
  } catch (err) {
    await session.abortTransaction();
    return err instanceof Error ? err.message : "Transfer failed.";
  } finally {
    session.endSession();
  }
}

/**
 * Fetch the current user's profile data (server-only).
 */
export async function getMyProfile() {
  const payload = await getAuthPayload();
  if (!payload) return null;

  await connectDB();
  const user = await User.findById(payload.userId).select("-otp -otpExpiry").lean();
  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    accountNumber: user.accountNumber,
    balance: user.balance,
  };
}

/**
 * Fetch transaction history for the current user with optional filters.
 */
export async function getMyTransactions(
  page = 1,
  filters: { type?: string; from?: string; to?: string; amount?: string } = {}
) {
  const payload = await getAuthPayload();
  if (!payload) return { transactions: [], total: 0 };

  await connectDB();

  const userId = new mongoose.Types.ObjectId(payload.userId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {
    $or: [{ senderId: userId }, { receiverId: userId }],
  };

  if (filters.type) query.type = filters.type;
  if (filters.from || filters.to) {
    query.timestamp = {};
    if (filters.from) query.timestamp.$gte = new Date(filters.from);
    if (filters.to) query.timestamp.$lte = new Date(filters.to + "T23:59:59Z");
  }
  if (filters.amount) {
    const amt = parseFloat(filters.amount);
    if (!isNaN(amt)) query.amount = amt;
  }

  const limit = 20;
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "name accountNumber")
      .populate("receiverId", "name accountNumber")
      .lean(),
    Transaction.countDocuments(query),
  ]);

  return {
    transactions: transactions.map((t) => ({
      id: t._id.toString(),
      transactionId: t.transactionId,
      type: t.type,
      amount: t.amount,
      status: t.status,
      timestamp: t.timestamp.toISOString(),
      sender: t.senderId
        ? {
            name: (t.senderId as { name: string; accountNumber: string }).name,
            accountNumber: (t.senderId as { name: string; accountNumber: string }).accountNumber,
          }
        : null,
      receiver: t.receiverId
        ? {
            name: (t.receiverId as { name: string; accountNumber: string }).name,
            accountNumber: (t.receiverId as { name: string; accountNumber: string }).accountNumber,
          }
        : null,
    })),
    total,
  };
}
