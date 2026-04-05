import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Loan from '../../../models/Loans';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const userId = req.headers.get('x-user-id');
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const loans = await Loan.find({ userId: userId }).sort({ createdAt: -1 });
        return NextResponse.json({ loans }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const userId = req.headers.get('x-user-id'); 
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const referenceCode = `LN-${Math.floor(100000 + Math.random() * 900000)}`;
        const dummyAccountId = new mongoose.Types.ObjectId();

        const newLoan = await Loan.create({
            loanReference: referenceCode,
            userId: userId,
            accountId: dummyAccountId, 
            loanType: body.loanType || 'Personal',
            principalAmount: body.principalAmount,
            interestRate: 9.5,
            tenureMonths: body.tenureMonths,
            emiAmount: body.emiAmount,
            remainingAmount: body.principalAmount, 
            currentStatus: 'Applied'
        });

        return NextResponse.json({ success: true, loan: newLoan }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to submit loan application' }, { status: 500 });
    }
}