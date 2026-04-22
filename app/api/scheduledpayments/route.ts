import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ScheduledPayment from "@/models/ScheduledPayments";
import Account from "@/models/Accounts";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rateLimit";

const getUserAuth = async (request: Request) => {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
            userId: string;
            role: string;
        };
        return decoded;
    } catch {
        return null;
    }
};

const calculateNextRunDate = (startDate: Date, frequency: string): Date => {
    const d = new Date(startDate);
    if (frequency === "Daily") d.setDate(d.getDate() + 1);
    else if (frequency === "Weekly") d.setDate(d.getDate() + 7);
    else if (frequency === "Monthly") d.setMonth(d.getMonth() + 1);
    else if (frequency === "Quarterly") d.setMonth(d.getMonth() + 3);
    else if (frequency === "Yearly") d.setFullYear(d.getFullYear() + 1);
    return d;
};

const generateRef = () =>
    `SCH-${Math.floor(Math.random() * 90000) + 10000}-${Date.now().toString().slice(-4)}`;

export async function GET(request: Request) {
    try {
        const reqHeaders = await headers();
        const ip =
            reqHeaders.get("x-forwarded-for") ??
            reqHeaders.get("x-real-ip") ??
            "unknown";
        if (!checkRateLimit(ip, "scheduled-get", 100, 15 * 60 * 1000)) {
            return NextResponse.json(
                { message: "Too many requests" },
                { status: 429 },
            );
        }
        const user = await getUserAuth(request);
        if (!user)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();

        const schedules = await ScheduledPayment.find({ userId: user.userId })
            .populate("accountId", "accountNumber accountType currency")
            .sort({ nextRunDate: 1 });

        return NextResponse.json({ schedules }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const reqHeaders = await headers();
        const ip =
            reqHeaders.get("x-forwarded-for") ??
            reqHeaders.get("x-real-ip") ??
            "unknown";
        if (!checkRateLimit(ip, "scheduled-post", 10, 15 * 60 * 1000)) {
            return NextResponse.json(
                { message: "Too many requests" },
                { status: 429 },
            );
        }
        const user = await getUserAuth(request);
        if (!user)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();

        const body = await request.json();
        const {
            fromAccountId,
            toAccountNumber,
            amount,
            memo,
            frequency,
            startDate,
        } = body;

        const sourceAccount = await Account.findOne({
            _id: fromAccountId,
            userId: user.userId,
            currentStatus: "Active",
        });
        if (!sourceAccount)
            return NextResponse.json(
                { message: "Invalid or inactive source account." },
                { status: 400 },
            );

        const targetAccount = await Account.findOne({
            accountNumber: toAccountNumber,
        });
        if (!targetAccount)
            return NextResponse.json(
                { message: "Recipient account not found." },
                { status: 404 },
            );

        const sDate = new Date(startDate);
        const nextDate = calculateNextRunDate(sDate, frequency);

        const newSchedule = new ScheduledPayment({
            scheduleReference: generateRef(),
            userId: user.userId,
            accountId: sourceAccount._id,
            beneficiaryId: targetAccount._id,
            amount: amount,
            currency: sourceAccount.currency,
            frequency: frequency,
            startDate: sDate,
            nextRunDate: nextDate,
            currentStatus: "Active",
            metadata: {
                description: memo,
            },
        });

        await newSchedule.save();

        return NextResponse.json(
            {
                message: "Transfer scheduled successfully",
                schedule: newSchedule,
            },
            { status: 201 },
        );
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const reqHeaders = await headers();
        const ip =
            reqHeaders.get("x-forwarded-for") ??
            reqHeaders.get("x-real-ip") ??
            "unknown";
        if (!checkRateLimit(ip, "scheduled-patch", 20, 15 * 60 * 1000)) {
            return NextResponse.json(
                { message: "Too many requests" },
                { status: 429 },
            );
        }
        const user = await getUserAuth(request);
        if (!user)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const { scheduleId, currentStatus } = await request.json();

        if (!["Active", "Paused", "Cancelled"].includes(currentStatus)) {
            return NextResponse.json(
                { message: "Invalid status." },
                { status: 400 },
            );
        }

        const schedule = await ScheduledPayment.findOneAndUpdate(
            { _id: scheduleId, userId: user.userId },
            { $set: { currentStatus } },
            { new: true },
        );

        if (!schedule)
            return NextResponse.json(
                { message: "Schedule not found." },
                { status: 404 },
            );

        return NextResponse.json(
            { message: `Schedule ${currentStatus} successfully.`, schedule },
            { status: 200 },
        );
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
