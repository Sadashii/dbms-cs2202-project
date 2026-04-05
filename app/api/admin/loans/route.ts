import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Loan from '../../../../models/Loans';

const MONGODB_URI = process.env.MONGODB_URI!;

async function connectToDatabase() {
    if (mongoose.connection.readyState >= 1) return;
    return mongoose.connect(MONGODB_URI);
}

export async function GET() {
    try {
        await connectToDatabase();
        const pendingLoans = await Loan.find({ currentStatus: 'Applied' })
            .populate('userId', 'name email') 
            .sort({ createdAt: -1 });

        return NextResponse.json({ loans: pendingLoans }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        await connectToDatabase();
        const { loanId, status } = await req.json();

        const dbStatus = status === 'Approved' ? 'Approved' : 'Rejected';
        
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const updatedLoan = await Loan.findByIdAndUpdate(
            loanId,
            { 
                currentStatus: dbStatus,
                ...(dbStatus === 'Approved' && { 
                    disbursedAt: new Date(),
                    nextPaymentDate: nextMonth 
                })
            },
            { new: true }
        );

        return NextResponse.json({ success: true, loan: updatedLoan });
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}