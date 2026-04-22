import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "unknown";
        if (!checkRateLimit(ip, "2fa-setup", 10, 15 * 60 * 1000)) {
            return NextResponse.json(
                { error: "Too many requests" },
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

        const user = await User.findById(authPayload.userId).select("email");
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        const secret = speakeasy.generateSecret({
            name: `VaultPay (${user.email})`,
        });
        const otpauth = secret.otpauth_url || "";
        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        // Save secret temporarily until verified
        // Using findByIdAndUpdate to avoid VersionError (optimistic concurrency)
        // which can happen if multiple setup requests are made simultaneously
        await User.findByIdAndUpdate(authPayload.userId, {
            $set: { twoFactorSecret: secret.base32 },
        });

        return NextResponse.json(
            { secret: secret.base32, qrCodeUrl },
            { status: 200 },
        );
    } catch (err: any) {
        console.error("2FA Setup Error:", err);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                details: err.message,
                stack: err.stack,
            },
            { status: 500 },
        );
    }
}
