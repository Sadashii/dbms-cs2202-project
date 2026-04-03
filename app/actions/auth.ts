"use server";

import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { sendOTPEmail } from "@/lib/email";
import { setAuthCookie, clearAuthCookie } from "@/lib/auth";
import { generateOTP } from "@/lib/utils";
import { redirect } from "next/navigation";

const OTP_EXPIRY_MINUTES = 10;

/**
 * Step 1 – Request an OTP.
 * Returns an error string on failure, or redirects to /verify on success.
 */
export async function requestOTP(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const email = (formData.get("email") as string | null)?.toLowerCase().trim();

  if (!email) return "Email is required.";

  await connectDB();
  const user = await User.findOne({ email });

  if (!user) {
    return "No account found for that email. Please contact an employee to create your account.";
  }

  const otp = generateOTP();
  const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  user.otp = otp;
  user.otpExpiry = expiry;
  await user.save();

  try {
    await sendOTPEmail(email, otp);
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    // Still continue – admin can view OTP in logs during development
  }

  redirect(`/verify?email=${encodeURIComponent(email)}`);
}

/**
 * Step 2 – Verify OTP and issue JWT cookie.
 */
export async function verifyOTP(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const email = (formData.get("email") as string | null)?.toLowerCase().trim();
  const otp = (formData.get("otp") as string | null)?.trim();

  if (!email || !otp) return "Email and OTP are required.";

  await connectDB();
  const user = await User.findOne({ email });

  if (!user) return "User not found.";
  if (!user.otp || !user.otpExpiry) return "No pending OTP. Please request a new one.";
  if (new Date() > user.otpExpiry) return "OTP has expired. Please request a new one.";
  if (user.otp !== otp) return "Invalid OTP.";

  // Clear OTP after successful use
  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  await setAuthCookie({ userId: user._id.toString(), role: user.role });

  redirect(user.role === "EMPLOYEE" ? "/admin" : "/dashboard");
}

/**
 * Sign out – clears the JWT cookie.
 */
export async function signOut(): Promise<void> {
  await clearAuthCookie();
  redirect("/login");
}
