import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Loan from "@/models/Loans";
import LoanPayment from "@/models/LoanPayments";
import Account from "@/models/Accounts";
import Transaction from "@/models/Transactions";
import Ledger from "@/models/Ledger";
import mongoose from "mongoose";
import { verifyAuth } from "@/lib/auth";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
    const reqHeaders = await headers();
    const ip = reqHeaders.get("x-forwarded-for") ?? reqHeaders.get("x-real-ip") ?? "unknown";
    if (!checkRateLimit(ip, "loan-repay", 10, 60 * 60 * 1000)) {
        return NextResponse.json(
            { message: "Too many repayment attempts. Please try again later." },
            { status: 429 },
        );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const decoded = verifyAuth(reqHeaders);
        if (!decoded)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const { loanId, paymentId, type } = await req.json();

        const loan = await Loan.findOne({
            _id: loanId,
            userId: decoded.userId,
        }).session(session);
        if (!loan)
            return NextResponse.json(
                { message: "Loan not found." },
                { status: 404 },
            );

        let amountToRepay = 0;
        let principalRepaid = 0;
        let interestRepaid = 0;
        let loanPayment = null;

        if (type === "EMI") {
            if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
                return NextResponse.json(
                    {
                        message:
                            "Valid Payment ID is required for EMI repayment.",
                    },
                    { status: 400 },
                );
            }
            loanPayment = await LoanPayment.findOne({
                _id: paymentId,
                loanId: loan._id,
                currentStatus: "Pending",
            }).session(session);
            if (!loanPayment)
                throw new Error("No pending EMI found for this loan.");

            amountToRepay = parseFloat(loanPayment.amountExpected.toString());
            principalRepaid = parseFloat(
                loanPayment.principalComponent.toString(),
            );
            interestRepaid = parseFloat(
                loanPayment.interestComponent.toString(),
            );
        } else if (type === "FORECLOSE") {
            amountToRepay = parseFloat(loan.remainingAmount.toString());
            principalRepaid = amountToRepay;
            interestRepaid = 0;
        } else {
            throw new Error("Invalid repayment type.");
        }

        const account = await Account.findById(loan.accountId).session(session);
        if (!account) throw new Error("Linked bank account not found.");
        if (parseFloat(account.balance.toString()) < amountToRepay) {
            throw new Error(
                `Insufficient funds in linked account. Required: ₹${amountToRepay.toLocaleString()}`,
            );
        }

        const prevBalance = parseFloat(account.balance.toString());
        account.balance = prevBalance - amountToRepay;
        await account.save({ session });

        const transaction = await Transaction.create(
            [
                {
                    referenceId: `RPY-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
                    type: "Withdrawal",
                    currency: loan.currency,
                    currentStatus: "Completed",
                    metadata: {
                        initiatedBy: decoded.userId,
                        loanId: loan._id,
                        accountId: account._id,
                        repaymentType: type,
                    },
                },
            ],
            { session },
        );

        await Ledger.create(
            [
                {
                    transactionId: transaction[0]._id,
                    accountId: account._id,
                    entryType: "Debit",
                    amount: -amountToRepay,
                    balanceAfter: account.balance,
                    memo: `${type === "EMI" ? "EMI Payment" : "Loan Foreclosure"} for ${loan.loanReference}`,
                },
            ],
            { session },
        );

        if (type === "EMI" && loanPayment) {
            loanPayment.amountPaid = amountToRepay;
            loanPayment.currentStatus = "Paid";
            loanPayment.paidDate = new Date();
            loanPayment.transactionId = transaction[0]._id;
            await loanPayment.save({ session });

            const remaining = parseFloat(loan.remainingAmount.toString());
            loan.remainingAmount = remaining - principalRepaid;
            loan.totalAmountPaid =
                parseFloat(loan.totalAmountPaid?.toString() || "0") +
                amountToRepay;
            loan.paidEmiCount += 1;
            loan.lastPaymentDate = new Date();

            if (loan.nextPaymentDate) {
                const next = new Date(loan.nextPaymentDate);
                next.setMonth(next.getMonth() + 1);
                loan.nextPaymentDate = next;
            }

            if (loan.remainingAmount <= 0.05) {
                loan.currentStatus = "Closed";
            }
            await loan.save({ session });
        } else if (type === "FORECLOSE") {
            loan.remainingAmount = 0;
            loan.currentStatus = "Closed";
            loan.totalAmountPaid =
                parseFloat(loan.totalAmountPaid?.toString() || "0") +
                amountToRepay;
            loan.lastPaymentDate = new Date();
            await loan.save({ session });

            await LoanPayment.updateMany(
                { loanId: loan._id, currentStatus: "Pending" },
                {
                    currentStatus: "Refunded",
                    metadata: { notes: "Canceled due to loan foreclosure" },
                },
            ).session(session);
        }

        await session.commitTransaction();
        return NextResponse.json({
            message: "Repayment Successful.",
            referenceId: transaction[0].referenceId,
        });
    } catch (error: any) {
        await session.abortTransaction();
        console.error("Repayment Error:", error.message);
        return NextResponse.json(
            { message: error.message || "Repayment failed." },
            { status: 400 },
        );
    } finally {
        session.endSession();
    }
}
