import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac } from "crypto";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Session from "@/models/Session";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SERVER_SECRET = process.env.OTP_SECRET || "my-otp-secret";

// Helper function to generate a Time-based One-Time Password
export function generateHashTimeOTP(bcryptHash: string, windowOffset: number = 0): string {
    const timeWindow = Math.floor(Date.now() / 60000) + windowOffset;
    const dataToHash = `${bcryptHash}:${timeWindow}`;
    const hmac = createHmac('sha256', SERVER_SECRET).update(dataToHash).digest('hex');
    const numericValue = parseInt(hmac.substring(0, 8), 16);
    const otp = numericValue % 1000000;

    return otp.toString().padStart(6, '0');
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const { process: requestprocess, email, password, otp } = body;

        // 1. Authenticate User Credentials
        // We must explicitly .select('+passwords') because we set select: false in the Schema
        const user = await User.findOne({ email: email.toLowerCase() }).select("+passwords");
        if (!user) {
            return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
        }

        // Check against the most recent password in the history array
        const latestPassword = user.passwords[user.passwords.length - 1];
        const isPasswordValid = await bcrypt.compare(password, latestPassword.hash);
        if (!isPasswordValid) {
            return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
        }

        // 2. Handle OTP Generation (Step 1)
        if (requestprocess === "generateotp") {
            const totp = generateHashTimeOTP(latestPassword.hash);
            
            // TODO: In a real app, trigger an SMS/Email service (e.g., Twilio or AWS SES) here.
            console.log(`[MOCK EMAIL/SMS] Your OTP for ${email} is: ${totp}`);
            
            return NextResponse.json({ message: "OTP sent to your registered email/device." }, { status: 200 });
        }

        // 3. Handle OTP Verification (Step 2)
        if (requestprocess === "verifyotp") {
            const presenttotp = generateHashTimeOTP(latestPassword.hash);
            const lastminutetotp = generateHashTimeOTP(latestPassword.hash, -1);

            // Allow the current 60-second window, or the previous 60-second window to account for delays
            if (otp !== presenttotp && otp !== lastminutetotp) {
                return NextResponse.json({ message: "Invalid or expired OTP." }, { status: 401 });
            }

            // Generate JWTs
            const accessToken = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_ACCESS_SECRET!,
                { expiresIn: "15m" } // Short-lived access token
            );

            const refreshToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_REFRESH_SECRET!,
                { expiresIn: "7d" } // Long-lived refresh token
            );

            // Store session in DB to allow remote revocation/logout
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            await Session.create({
                userId: user._id,
                refreshToken,
                expiresAt,
            });

            // Set HttpOnly Cookie (Immune to XSS)
            (await cookies()).set("refresh_token", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
                path: "/",
            });

            const userPayload = {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                currentStatus: user.currentStatus,
            };

            return NextResponse.json({ 
                message: "Authentication successful.", 
                access_token: accessToken, 
                user: userPayload 
            }, { status: 200 });
        }

        return NextResponse.json({ message: "Invalid process type." }, { status: 400 });

    } catch (error: any) {
        console.error("Login Error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}