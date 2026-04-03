import nodemailer from "nodemailer";
import { OTP_EXPIRY_MINUTES } from "@/lib/constants";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.ethereal.email",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(to: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "noreply@banking.local",
    to,
    subject: "Your Banking Platform OTP",
    text: `Your one-time password is: ${otp}\n\nIt expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1d4ed8;">Banking Platform</h2>
        <p>Use the following OTP to log in. It expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
        <div style="font-size: 2rem; font-weight: bold; letter-spacing: 0.25em; color: #1d4ed8; margin: 16px 0;">${otp}</div>
        <p style="color: #6b7280; font-size: 0.875rem;">Do not share this code with anyone.</p>
      </div>
    `,
  });
}

export async function sendAccountCreatedEmail(
  to: string,
  name: string,
  accountNumber: string
): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "noreply@banking.local",
    to,
    subject: "Welcome to Banking Platform",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1d4ed8;">Welcome, ${name}!</h2>
        <p>Your account has been created successfully.</p>
        <p><strong>Account Number:</strong> ${accountNumber}</p>
        <p>You can log in at any time using your email address.</p>
      </div>
    `,
  });
}
