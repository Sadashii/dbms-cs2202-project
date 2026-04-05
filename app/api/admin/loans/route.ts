import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Loan from '@/models/Loans';
import Account from '@/models/Accounts';
import Transaction from '@/models/Transactions';
import Ledger from '@/models/Ledger';
import mongoose from 'mongoose';
import { verifyAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded || !['Admin', 'Manager', 'Employee'].includes(decoded.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const pendingLoans = await Loan.find({ currentStatus: 'Applied' })
            .populate('userId', 'firstName lastName email') 
            .sort({ createdAt: -1 });

        // Serialize Decimal128 for UI
        const formattedLoans = pendingLoans.map((loan: any) => ({
            ...loan._doc,
            principalAmount: parseFloat(loan.principalAmount.toString()),
            emiAmount: parseFloat(loan.emiAmount.toString()),
            interestRate: parseFloat(loan.interestRate.toString())
        }));

        return NextResponse.json({ loans: formattedLoans }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const decoded = verifyAuth(await headers());
        if (!decoded || !['Admin', 'Manager', 'Employee'].includes(decoded.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { loanId, status } = await req.json();

        const loan = await Loan.findById(loanId).session(session);
        if (!loan) {
            return NextResponse.json({ message: "Loan not found" }, { status: 404 });
        }

        if (loan.currentStatus !== 'Applied') {
            return NextResponse.json({ message: "This loan has already been processed." }, { status: 400 });
        }

        const prevState = loan.currentStatus;
        const dbStatus = status === 'Approved' ? 'Approved' : 'Rejected';

        if (dbStatus === 'Approved') {
            // 1. Credit the User's Linked Account
            const account = await Account.findById(loan.accountId).session(session);
            if (!account) throw new Error("Linked disbursement account not found.");

            const principal = parseFloat(loan.principalAmount.toString());
            const previousBalance = parseFloat(account.balance.toString());
            account.balance = (previousBalance + principal);
            await account.save({ session });

            // 2. Create Transaction Record
            const transaction = await Transaction.create([{
                referenceId: `DSB-${loan.loanReference}`,
                type: 'Deposit', 
                currency: loan.currency,
                currentStatus: 'Completed',
                metadata: {
                    initiatedBy: decoded.userId,
                    reason: 'Loan Disbursement',
                    loanId: loan._id,
                    accountId: account._id
                }
            }], { session });

            // 3. Create Ledger Entry
            await Ledger.create([{
                transactionId: transaction[0]._id,
                accountId: account._id,
                entryType: 'Credit',
                amount: principal,
                balanceAfter: account.balance,
                memo: `Disbursement of ${loan.loanType} Loan: ${loan.loanReference}`
            }], { session });

            // 4. Update Loan Status
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(1); // Standardized to 1st of next month

            loan.currentStatus = 'Active';
            loan.disbursedAt = new Date();
            loan.nextPaymentDate = nextMonth;
            await loan.save({ session });

        } else {
            loan.currentStatus = 'Rejected';
            await loan.save({ session });
        }

        // 5. Log Action
        await createAuditLog({
            userId: decoded.userId,
            userRole: decoded.role,
            actionType: dbStatus === 'Approved' ? 'LOAN_APPROVED' : 'LOAN_REJECTED',
            category: 'Financial',
            severity: dbStatus === 'Approved' ? 'Medium' : 'High',
            resource: 'Loan',
            resourceId: loanId,
            description: `Loan ${dbStatus} and ${dbStatus === 'Approved' ? 'disbursed' : 'dropped'}. Reference: ${loan.loanReference}`,
            currentStatus: 'Success'
        });

        await session.commitTransaction();
        return NextResponse.json({ success: true, message: `Loan ${dbStatus} successfully.` });

    } catch (error: any) {
        await session.abortTransaction();
        console.error("Loan Approval Error:", error.message);
        return NextResponse.json({ message: error.message || "Failed to process loan." }, { status: 400 });
    } finally {
        session.endSession();
    }
}