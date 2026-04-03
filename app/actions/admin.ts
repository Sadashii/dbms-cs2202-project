"use server";

import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Transaction from "@/lib/models/Transaction";
import { getAuthPayload } from "@/lib/auth";
import { generateAccountNumber, generateTransactionId } from "@/lib/utils";
import { sendAccountCreatedEmail } from "@/lib/email";
import mongoose from "mongoose";

async function assertEmployee(): Promise<void> {
  const payload = await getAuthPayload();
  if (!payload || payload.role !== "EMPLOYEE") {
    throw new Error("Unauthorized. Employee access required.");
  }
}

export type CreateCustomerResult =
  | { ok: true; accountNumber: string }
  | { ok: false; error: string }
  | null;

/**
 * Create a new customer account.
 */
export async function createCustomer(
  _prevState: CreateCustomerResult,
  formData: FormData
): Promise<CreateCustomerResult> {
  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.toLowerCase().trim();
  const initialBalanceStr = (formData.get("initialBalance") as string | null)?.trim() ?? "0";

  if (!name || !email) return { ok: false, error: "Name and email are required." };

  const initialBalance = parseFloat(initialBalanceStr);
  if (isNaN(initialBalance) || initialBalance < 0)
    return { ok: false, error: "Initial balance must be >= 0." };

  try {
    await assertEmployee();
  } catch {
    return { ok: false, error: "Unauthorized." };
  }

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) return { ok: false, error: "A user with that email already exists." };

  const accountNumber = generateAccountNumber();

  await User.create({
    name,
    email,
    role: "CUSTOMER",
    accountNumber,
    balance: initialBalance,
  });

  try {
    await sendAccountCreatedEmail(email, name, accountNumber);
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }

  return { ok: true, accountNumber };
}

/**
 * Deposit funds into a customer's account.
 */
export async function depositFunds(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const accountNumber = (formData.get("accountNumber") as string | null)?.trim();
  const amountStr = (formData.get("amount") as string | null)?.trim();

  if (!accountNumber || !amountStr) return "All fields are required.";
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return "Amount must be a positive number.";

  try {
    await assertEmployee();
  } catch {
    return "Unauthorized.";
  }

  await connectDB();
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findOne({ accountNumber }).session(session);
    if (!user) throw new Error("Account not found.");

    user.balance += amount;
    await user.save({ session });

    await Transaction.create(
      [
        {
          transactionId: generateTransactionId(),
          type: "DEPOSIT",
          amount,
          senderId: null,
          receiverId: user._id,
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
    return err instanceof Error ? err.message : "Deposit failed.";
  } finally {
    session.endSession();
  }
}

/**
 * Withdraw funds from a customer's account.
 */
export async function withdrawFunds(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const accountNumber = (formData.get("accountNumber") as string | null)?.trim();
  const amountStr = (formData.get("amount") as string | null)?.trim();

  if (!accountNumber || !amountStr) return "All fields are required.";
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return "Amount must be a positive number.";

  try {
    await assertEmployee();
  } catch {
    return "Unauthorized.";
  }

  await connectDB();
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findOne({ accountNumber }).session(session);
    if (!user) throw new Error("Account not found.");
    if (user.balance < amount) throw new Error("Insufficient funds in account.");

    user.balance -= amount;
    await user.save({ session });

    await Transaction.create(
      [
        {
          transactionId: generateTransactionId(),
          type: "WITHDRAWAL",
          amount,
          senderId: user._id,
          receiverId: null,
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
    return err instanceof Error ? err.message : "Withdrawal failed.";
  } finally {
    session.endSession();
  }
}

/**
 * Admin transfer between any two accounts.
 */
export async function adminTransfer(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const senderAccount = (formData.get("senderAccount") as string | null)?.trim();
  const receiverAccount = (formData.get("receiverAccount") as string | null)?.trim();
  const amountStr = (formData.get("amount") as string | null)?.trim();

  if (!senderAccount || !receiverAccount || !amountStr) return "All fields are required.";
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return "Amount must be a positive number.";
  if (senderAccount === receiverAccount) return "Sender and receiver must be different accounts.";

  try {
    await assertEmployee();
  } catch {
    return "Unauthorized.";
  }

  await connectDB();
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const sender = await User.findOne({ accountNumber: senderAccount }).session(session);
    if (!sender) throw new Error("Sender account not found.");
    if (sender.balance < amount) throw new Error("Insufficient funds in sender account.");

    const receiver = await User.findOne({ accountNumber: receiverAccount }).session(session);
    if (!receiver) throw new Error("Receiver account not found.");

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
 * Fetch all customers (paginated).
 */
export async function getCustomers(page = 1) {
  try {
    await assertEmployee();
  } catch {
    return { customers: [], total: 0 };
  }

  await connectDB();
  const limit = 20;
  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    User.find({ role: "CUSTOMER" })
      .select("-otp -otpExpiry")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments({ role: "CUSTOMER" }),
  ]);

  return {
    customers: customers.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      accountNumber: u.accountNumber,
      balance: u.balance,
      createdAt: (u.createdAt as Date).toISOString(),
    })),
    total,
  };
}
