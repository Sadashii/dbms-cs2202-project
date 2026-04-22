import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { createHmac } from "crypto";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Session from "@/models/Session";
import Notification from "@/models/Notifications";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rateLimit";
import { createAuditLog } from "@/lib/audit";
import {
    backfillMissingCustomerIds,
    isCustomerId,
    normalizeCustomerId,
} from "@/lib/customerId";

const SERVER_SECRET = process.env.OTP_SECRET || "my-otp-secret";

export function generateHashTimeOTP(
    bcryptHash: string,
    windowOffset: number = 0,
): string {
    const timeWindow = Math.floor(Date.now() / 60000) + windowOffset;
    const dataToHash = `${bcryptHash}:${timeWindow}`;
    const hmac = createHmac("sha256", SERVER_SECRET)
        .update(dataToHash)
        .digest("hex");
    const numericValue = parseInt(hmac.substring(0, 8), 16);
    const otp = numericValue % 1000000;

    return otp.toString().padStart(6, "0");
}

const LoginSchema = z.object({
    process: z.enum(["generateotp", "verifyotp"]),
    identifier: z.string().min(1, "Email or customer ID is required").trim(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    otp: z.string().length(6).optional(),
});

export async function POST(req: Request) {
    try {
        const reqHeaders = await headers();
        const ip =
            reqHeaders.get("x-forwarded-for") ??
            reqHeaders.get("x-real-ip") ??
            "unknown";
        if (!checkRateLimit(ip, "login", 10, 15 * 60 * 1000)) {
            return NextResponse.json(
                {
                    message:
                        "Too many login attempts. Please try again in 15 minutes.",
                },
                { status: 429 },
            );
        }

        await dbConnect();
        await backfillMissingCustomerIds();
        const rawBody = await req.json();
        const parseResult = LoginSchema.safeParse(rawBody);
        if (!parseResult.success) {
            return NextResponse.json(
                { message: parseResult.error.issues[0].message },
                { status: 400 },
            );
        }
        const {
            process: requestprocess,
            identifier,
            password,
            otp,
        } = parseResult.data;

        const normalizedIdentifier = identifier.trim();
        const userLookup = isCustomerId(normalizedIdentifier)
            ? { customerId: normalizeCustomerId(normalizedIdentifier) }
            : { email: normalizedIdentifier.toLowerCase() };

        const user = await User.findOne(userLookup).select("+passwords");
        if (!user) {
            return NextResponse.json(
                { message: "Invalid email or password." },
                { status: 401 },
            );
        }

        const latestPassword = user.passwords[user.passwords.length - 1];
        const isPasswordValid = await bcrypt.compare(
            password,
            latestPassword.hash,
        );
        if (!isPasswordValid) {
            return NextResponse.json(
                { message: "Invalid email or password." },
                { status: 401 },
            );
        }

        if (requestprocess === "generateotp") {
            const totp = generateHashTimeOTP(latestPassword.hash);
            await Notification.create({
                userId: user._id,
                title: "Login Verification OTP",
                body: `Your Secure OTP is: ${totp}. It expires in 60 seconds.`,
                type: "System",
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            });
            return NextResponse.json(
                {
                    message: "OTP sent to your registered email/device.",
                    otp: totp,
                },
                { status: 200 },
            );
        }

        if (requestprocess === "verifyotp") {
            const presenttotp = generateHashTimeOTP(latestPassword.hash);
            const lastminutetotp = generateHashTimeOTP(latestPassword.hash, -1);

            if (otp !== presenttotp && otp !== lastminutetotp) {
                return NextResponse.json(
                    { message: "Invalid or expired OTP." },
                    { status: 401 },
                );
            }

            const accessToken = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_ACCESS_SECRET!,
                { expiresIn: "15m" },
            );

            const refreshToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_REFRESH_SECRET!,
                { expiresIn: "7d" },
            );

            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            const userAgent = reqHeaders.get("user-agent") || "Unknown Device";
            
            const country = reqHeaders.get("x-vercel-ip-country") || reqHeaders.get("cf-ipcountry");
            const city = reqHeaders.get("x-vercel-ip-city");
            const location = city && country ? `${city}, ${country}` : (country || "Unknown Location");

            await Session.create({
                userId: user._id,
                refreshToken,
                ipAddress: ip,
                userAgent,
                location,
                last_seen: new Date(),
                expiresAt,
            });

            (await cookies()).set("refresh_token", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60,
                path: "/",
            });

            const userPayload = {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                customerId: user.customerId,
                email: user.email,
                role: user.role,
                currentStatus: user.currentStatus,
            };

            await createAuditLog({
                userId: user._id,
                userRole: user.role,
                actionType: "AUTH_LOGIN",
                category: "Security",
                severity: "Low",
                resource: "Auth",
                resourceId: user._id,
                description: `Successful login for user ${user.email}`,
                currentStatus: "Success",
                payload: {
                    newState: JSON.stringify({
                        email: user.email,
                        role: user.role,
                        lastLogin: new Date().toISOString(),
                    }),
                },
            });

            return NextResponse.json(
                {
                    message: "Authentication successful.",
                    access_token: accessToken,
                    user: userPayload,
                },
                { status: 200 },
            );
        }

        return NextResponse.json(
            { message: "Invalid process type." },
            { status: 400 },
        );
    } catch (error: any) {
        console.error("Login Error:", error);
        return NextResponse.json(
            { message: "Internal server error." },
            { status: 500 },
        );
    }
}
