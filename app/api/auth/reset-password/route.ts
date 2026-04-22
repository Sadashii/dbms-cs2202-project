import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notifications";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";
import {
    backfillMissingCustomerIds,
    normalizeCustomerId,
} from "@/lib/customerId";
import { generateHashTimeOTP } from "@/app/api/auth/login/route";

const ResetPasswordSchema = z.object({
    process: z.enum(["generateotp", "verifyotp"]),
    customerId: z.string().min(1, "Customer ID is required").trim(),
    email: z.string().email("Valid email is required").toLowerCase(),
    oldPassword: z
        .string()
        .min(8, "Old password must be at least 8 characters"),
    newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters"),
    otp: z.string().length(6).optional(),
});

const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export async function POST(req: Request) {
    try {
        await dbConnect();
        await backfillMissingCustomerIds();

        const rawBody = await req.json();
        const parseResult = ResetPasswordSchema.safeParse(rawBody);

        if (!parseResult.success) {
            return NextResponse.json(
                { message: parseResult.error.issues[0].message },
                { status: 400 },
            );
        }

        const { process, customerId, email, oldPassword, newPassword, otp } =
            parseResult.data;

        if (!strongPasswordRegex.test(newPassword)) {
            return NextResponse.json(
                {
                    message:
                        "New password must include uppercase, lowercase, number, and special character.",
                },
                { status: 400 },
            );
        }

        const user = await User.findOne({
            customerId: normalizeCustomerId(customerId),
            email: email.toLowerCase(),
        }).select("+passwords");

        if (!user) {
            return NextResponse.json(
                { message: "Customer ID and email do not match any account." },
                { status: 404 },
            );
        }

        const latestPassword = user.passwords[user.passwords.length - 1];
        const isOldPasswordValid = await bcrypt.compare(
            oldPassword,
            latestPassword.hash,
        );

        if (!isOldPasswordValid) {
            return NextResponse.json(
                { message: "Old password is incorrect." },
                { status: 401 },
            );
        }

        const recentPasswords = user.passwords.slice(-3);
        for (const pastPassword of recentPasswords) {
            const isSameAsPast = await bcrypt.compare(
                newPassword,
                pastPassword.hash,
            );
            if (isSameAsPast) {
                return NextResponse.json(
                    {
                        message:
                            "New password must not be the same as any of your previous 3 passwords.",
                    },
                    { status: 400 },
                );
            }
        }

        if (process === "generateotp") {
            const totp = generateHashTimeOTP(latestPassword.hash);

            await Notification.create({
                userId: user._id,
                title: "Password Reset Verification OTP",
                body: `Your password reset OTP is: ${totp}. It expires in 60 seconds.`,
                type: "System",
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            });

            return NextResponse.json(
                {
                    message: "Password reset OTP generated successfully.",
                    otp: totp,
                },
                { status: 200 },
            );
        }

        const currentOtp = generateHashTimeOTP(latestPassword.hash);
        const previousWindowOtp = generateHashTimeOTP(latestPassword.hash, -1);

        if (otp !== currentOtp && otp !== previousWindowOtp) {
            return NextResponse.json(
                { message: "Invalid or expired OTP." },
                { status: 401 },
            );
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        user.passwords.push({ hash: hashedNewPassword, createdAt: new Date() });
        await user.save();

        await createAuditLog({
            userId: user._id,
            userRole: user.role,
            actionType: "AUTH_PASSWORD_RESET",
            category: "Security",
            severity: "Medium",
            resource: "Auth",
            resourceId: user._id,
            description: `Password reset completed for user ${user.email}`,
            currentStatus: "Success",
            payload: {
                newState: JSON.stringify({
                    email: user.email,
                    customerId: user.customerId,
                    passwordResetAt: new Date().toISOString(),
                }),
            },
        });

        return NextResponse.json(
            { message: "Password updated successfully. Please sign in again." },
            { status: 200 },
        );
    } catch (error) {
        console.error("Reset Password Error:", error);
        return NextResponse.json(
            { message: "Internal server error." },
            { status: 500 },
        );
    }
}
