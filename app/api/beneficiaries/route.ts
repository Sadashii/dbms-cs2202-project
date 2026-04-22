import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Beneficiary from "@/models/Beneficiary";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const beneficiaries = await Beneficiary.find({
            userId: decoded.userId,
        }).sort({ nickName: 1 });

        return NextResponse.json({ beneficiaries });
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to fetch beneficiaries." },
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

        await dbConnect();
        const { nickName, accountNumber, accountName } = await req.json();

        if (!nickName || !accountNumber || !accountName) {
            return NextResponse.json(
                { message: "Missing required fields." },
                { status: 400 },
            );
        }

        const existing = await Beneficiary.findOne({
            userId: decoded.userId,
            accountNumber,
        });
        if (existing) {
            return NextResponse.json(
                {
                    message:
                        "Recipient with this account number is already saved.",
                },
                { status: 400 },
            );
        }

        const newBeneficiary = await Beneficiary.create({
            userId: decoded.userId,
            nickName,
            accountNumber,
            accountName,
        });

        return NextResponse.json(
            {
                success: true,
                message: "Recipient saved successfully.",
                beneficiary: newBeneficiary,
            },
            { status: 201 },
        );
    } catch (error: any) {
        console.error("Beneficiary Save Error:", error);
        return NextResponse.json(
            { message: "Failed to save recipient." },
            { status: 500 },
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id)
            return NextResponse.json(
                { message: "Recipient ID is required." },
                { status: 400 },
            );

        const { nickName } = await req.json();
        if (!nickName?.trim())
            return NextResponse.json(
                { message: "Nickname is required." },
                { status: 400 },
            );

        await dbConnect();
        const updated = await Beneficiary.findOneAndUpdate(
            { _id: id, userId: decoded.userId },
            { nickName: nickName.trim() },
            { new: true },
        );

        if (!updated)
            return NextResponse.json(
                { message: "Recipient not found or unauthorized." },
                { status: 404 },
            );

        return NextResponse.json({
            success: true,
            message: "Recipient updated.",
            beneficiary: updated,
        });
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to update recipient." },
            { status: 500 },
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id)
            return NextResponse.json(
                { message: "Recipient ID is required." },
                { status: 400 },
            );

        await dbConnect();
        const deleted = await Beneficiary.findOneAndDelete({
            _id: id,
            userId: decoded.userId,
        });

        if (!deleted) {
            return NextResponse.json(
                { message: "Recipient not found or unauthorized." },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            message: "Recipient removed.",
        });
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to remove recipient." },
            { status: 500 },
        );
    }
}
