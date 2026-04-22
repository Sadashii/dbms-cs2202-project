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
import { backfillMissingCustomerIds, isCustomerId, normalizeCustomerId } from "@/lib/customerId";

const SERVER_SECRET = process.env.OTP_SECRET || "my-otp-secret";

// Helper function to generate a Time-based One-Time Password
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
    // Rate limit: 10 attempts per IP per 5 minutes
    const reqHeaders = await headers();
    const ip =
      reqHeaders.get("x-forwarded-for") ??
      reqHeaders.get("x-real-ip") ??
      "unknown";
    if (!checkRateLimit(ip, "login", 10, 5 * 60 * 1000)) {
      return NextResponse.json(
        { message: "Too many login attempts. Please try again in 5 minutes." },
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
    const { process: requestprocess, identifier, password, otp } = parseResult.data; // 1. Authenticate User Credentials
    // We must explicitly .select('+passwords') because we set select: false in the Schema

    const normalizedIdentifier = identifier.trim();
    const userLookup = isCustomerId(normalizedIdentifier)
      ? { customerId: normalizeCustomerId(normalizedIdentifier) }
      : { email: normalizedIdentifier.toLowerCase() };

    const user = await User.findOne(userLookup).select(
      "+passwords",
    );
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    } // Check against the most recent password in the history array

    const latestPassword = user.passwords[user.passwords.length - 1];
    const isPasswordValid = await bcrypt.compare(password, latestPassword.hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    } // 2. Handle OTP Generation (Step 1)

    if (requestprocess === "generateotp") {
      const totp = generateHashTimeOTP(latestPassword.hash);
      console.log(`============= MOCK SMS/EMAIL =============`);
      console.log(`To: ${user.email}`);
      console.log(`Subject: VaultPay Login Verification`);
      console.log(
        `Message: Your Secure OTP is: ${totp}. Do not share this. It expires in 60 seconds.`,
      );
      console.log(`==========================================`); // Create a System Alert so users can view the OTP in their dashboard if logged in elsewhere
      await Notification.create({
        userId: user._id,
        title: "Login Verification OTP",
        body: `Your Secure OTP is: ${totp}. It expires in 60 seconds.`,
        type: "System",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Keep for 5 minutes
      });
      return NextResponse.json(
        {
          message: "OTP sent to your registered email/device.",
          otp: totp,
        },
        { status: 200 },
      );
    } // 3. Handle OTP Verification (Step 2)

    if (requestprocess === "verifyotp") {
      const presenttotp = generateHashTimeOTP(latestPassword.hash);
      const lastminutetotp = generateHashTimeOTP(latestPassword.hash, -1); // Allow the current 60-second window, or the previous 60-second window to account for delays

      if (otp !== presenttotp && otp !== lastminutetotp) {
        return NextResponse.json(
          { message: "Invalid or expired OTP." },
          { status: 401 },
        );
      } // Generate JWTs

      const accessToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: "15m" }, // Short-lived access token
      );

      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: "7d" }, // Long-lived refresh token
      ); // Store session in DB to allow remote revocation/logout

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await Session.create({
        userId: user._id,
        refreshToken,
        expiresAt,
      }); // Set HttpOnly Cookie (Immune to XSS)

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
        customerId: user.customerId,
        email: user.email,
        role: user.role,
        currentStatus: user.currentStatus,
      }; // Log the successful login

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
