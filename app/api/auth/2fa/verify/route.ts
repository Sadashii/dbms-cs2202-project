import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "unknown";
        if (!checkRateLimit(ip, "2fa-verify", 10, 15 * 60 * 1000)) {
            return NextResponse.json(
                { error: "Too many attempts" },
                { status: 429 },
            );
        }
        await dbConnect();
        const authPayload = verifyAuth(req.headers);
        if (!authPayload || !authPayload.userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await req.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json(
                { error: "Token is required" },
                { status: 400 },
            );
        }

        const user = await User.findById(authPayload.userId).select(
            "+twoFactorSecret",
        );
        if (!user || !user.twoFactorSecret) {
            return NextResponse.json(
                { error: "User or secret not found" },
                { status: 404 },
            );
        }

        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: "base32",
            token,
            window: 1,
        });
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid verification code" },
                { status: 400 },
            );
        }

        await User.findByIdAndUpdate(authPayload.userId, {
            $set: { isTwoFactorEnabled: true },
        });

        return NextResponse.json(
            { message: "2FA enabled successfully" },
            { status: 200 },
        );
    } catch (err) {
        console.error("2FA Verify Error:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
