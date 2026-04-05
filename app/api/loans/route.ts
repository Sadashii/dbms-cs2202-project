import { NextResponse } from "next/server";
import { headers } from "next/headers";
import mongoose from "mongoose";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Loan from "@/models/Loans";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // --- Pagination ---
        const url = new URL(req.url);
        const page  = Math.max(1, parseInt(url.searchParams.get("page")  || "1"));
        const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10")));
        const skip  = (page - 1) * limit;

        const [loans, total] = await Promise.all([
            Loan.find({ userId: decoded.userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Loan.countDocuments({ userId: decoded.userId }),
        ]);

        // Serialize Decimal128 fields
        const formattedLoans = loans.map((loan: any) => ({
            ...loan,
            principalAmount: loan.principalAmount ? parseFloat(loan.principalAmount.toString()) : 0,
            remainingAmount: loan.remainingAmount ? parseFloat(loan.remainingAmount.toString()) : 0,
            emiAmount:       loan.emiAmount       ? parseFloat(loan.emiAmount.toString())       : 0,
            interestRate:    loan.interestRate    ? parseFloat(loan.interestRate.toString())    : 0,
        }));

        return NextResponse.json({
            loans: formattedLoans,
            pagination: {
                page,
                limit,
                total,
                totalPages:  Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            },
        }, { status: 200 });

    } catch (error: any) {
        console.error("Loans Fetch Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const body = await req.json();
        const { loanType, principalAmount, tenureMonths, emiAmount, accountId } = body;

        if (!principalAmount || !tenureMonths || !emiAmount || !accountId) {
            return NextResponse.json({ message: "Missing required fields (Amount, Tenure, EMI, or Account)." }, { status: 400 });
        }

        const referenceCode = `LN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

        const newLoan = await Loan.create({
            loanReference: referenceCode,
            userId: decoded.userId,
            accountId: new mongoose.Types.ObjectId(accountId),
            loanType: loanType || "Personal",
            principalAmount,
            interestRate: 9.5,
            tenureMonths,
            emiAmount,
            remainingAmount: principalAmount,
            currentStatus: "Applied",
        });

        return NextResponse.json({ success: true, loan: newLoan }, { status: 201 });
    } catch (error: any) {
        console.error("Loan Creation Error:", error);
        return NextResponse.json({ message: "Failed to submit loan application." }, { status: 500 });
    }
}