import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Loan from "@/models/Loans";
import LoanPayment from "@/models/LoanPayments";
import { verifyAuth } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: Request) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        const { searchParams } = new URL(req.url);
        const loanId = searchParams.get("loanId");

        if (!loanId)
            return NextResponse.json(
                { message: "Loan ID is required." },
                { status: 400 },
            );

        await dbConnect();
        const payments = await LoanPayment.find({
            loanId,
            userId: decoded.userId,
        })
            .sort({ dueDate: 1 })
            .lean();

        const formattedPayments = payments.map((p: any) => ({
            ...p,
            amountExpected: parseFloat(p.amountExpected.toString()),
            amountPaid: parseFloat(p.amountPaid.toString()),
            principalComponent: parseFloat(p.principalComponent.toString()),
            interestComponent: parseFloat(p.interestComponent.toString()),
            lateFeeComponent: parseFloat(p.lateFeeComponent.toString()),
        }));

        return NextResponse.json({ payments: formattedPayments });
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to fetch payments." },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        const { loanId } = await req.json();
        await dbConnect();

        const loan = await Loan.findOne({
            _id: loanId,
            userId: decoded.userId,
        });
        if (!loan)
            return NextResponse.json(
                { message: "Loan not found." },
                { status: 404 },
            );
        if (loan.currentStatus !== "Active")
            return NextResponse.json(
                { message: "Loan is not active." },
                { status: 400 },
            );

        const existingPending = await LoanPayment.findOne({
            loanId,
            currentStatus: "Pending",
        });
        if (existingPending)
            return NextResponse.json(
                { message: "An EMI is already billed and pending payment." },
                { status: 400 },
            );

        const remainingPrincipal = parseFloat(loan.remainingAmount.toString());
        if (remainingPrincipal <= 0)
            return NextResponse.json(
                { message: "Loan is fully paid." },
                { status: 400 },
            );

        const monthlyRate = parseFloat(loan.interestRate.toString()) / 12 / 100;
        const totalEmi = parseFloat(loan.emiAmount.toString());

        const interestComponent = remainingPrincipal * monthlyRate;
        let principalComponent = totalEmi - interestComponent;

        if (principalComponent >= remainingPrincipal) {
            principalComponent = remainingPrincipal;
        }

        const paymentReference = `PAY-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

        const newPayment = await LoanPayment.create({
            paymentReference,
            loanId: loan._id,
            userId: decoded.userId,
            amountExpected: principalComponent + interestComponent,
            amountPaid: 0,
            principalComponent,
            interestComponent,
            lateFeeComponent: 0,
            dueDate: loan.nextPaymentDate || new Date(),
            currentStatus: "Pending",
            metadata: {
                notes: `System generated installment #${loan.paidEmiCount + 1}`,
            },
        });

        return NextResponse.json({
            message: "EMI Billed Successfully.",
            payment: newPayment,
        });
    } catch (error: any) {
        console.error("Billing Error:", error);
        return NextResponse.json(
            { message: error.message || "Billing failed." },
            { status: 500 },
        );
    }
}
