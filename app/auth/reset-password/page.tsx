"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthContext } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { getResetPasswordOTP, confirmPasswordReset, verifyConstraints } = useAuthContext();

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [errors, setErrors] = useState<{
    customerId?: string;
    email?: string;
    password?: string;
    confirmpassword?: string;
    oldPassword?: string;
    otp?: string;
  }>({});
  const otpToastIdRef = useRef<string | null>(null);

  const onOTPPaste = (inputIndex: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    if (!/^\d+$/.test(pastedData)) return;

    setOtp((state) => {
      const newOtp = [...state];
      for (let i = 0; i < pastedData.length; i++) {
        if (inputIndex + i < newOtp.length) {
          newOtp[inputIndex + i] = pastedData[i];
        }
      }

      setTimeout(() => {
        document.getElementById(`reset-otp-${Math.min(inputIndex + pastedData.length, newOtp.length - 1)}`)?.focus();
      }, 0);

      return newOtp;
    });
  };

  const onOTPEnter = (inputIndex: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const char = val.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    setOtp((state) => {
      const newOtp = [...state];
      newOtp[inputIndex] = char;
      return newOtp;
    });

    if (char && inputIndex < 5) {
      setTimeout(() => {
        document.getElementById(`reset-otp-${inputIndex + 1}`)?.focus();
      }, 0);
    }
  };

  const onOTPKeyDown = (inputIndex: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[inputIndex] === "") {
      e.preventDefault();
      if (inputIndex > 0) {
        document.getElementById(`reset-otp-${inputIndex - 1}`)?.focus();
      }
    }
  };

  const showOtpToast = (otpCode: string) => {
    if (otpToastIdRef.current) {
      toast.dismiss(otpToastIdRef.current);
    }

    const toastId = toast.custom(
      (t) => (
        <div
          className={`w-[min(92vw,28rem)] rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl shadow-blue-100/60 transition-all duration-200 dark:border-blue-900/50 dark:bg-slate-900 dark:shadow-black/30 ${
            t.visible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-2 opacity-0 scale-95"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                Reset OTP
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
                Confirm your password change
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                For customer ID <span className="font-medium text-slate-900 dark:text-white">{customerId}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Dismiss reset OTP toast"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
            <div className="text-center text-3xl font-bold tracking-[0.45em] text-blue-600 dark:text-blue-400">
              {otpCode}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Use this OTP to finish updating your password securely.
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(otpCode);
                  toast.success("OTP copied");
                } catch {
                  toast.error("Could not copy OTP");
                }
              }}
              className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Copy OTP
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        position: "top-center",
      }
    );

    otpToastIdRef.current = toastId;
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = verifyConstraints({
      email: { value: email },
      password: { value: newPassword },
      confirmpassword: { value: confirmPassword },
    });

    const nextErrors: typeof errors = { ...validation.errors };

    if (!customerId.trim()) {
      nextErrors.customerId = "Customer ID is required.";
    }

    if (!oldPassword.trim()) {
      nextErrors.oldPassword = "Old password is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const result = await getResetPasswordOTP(customerId, email, oldPassword, newPassword);

    if (result.success) {
      if (result.otp) {
        showOtpToast(result.otp);
      } else if (result.message) {
        toast.success(result.message);
      }

      setStep(2);
      setTimeout(() => {
        document.getElementById("reset-otp-0")?.focus();
      }, 100);
    }

    setIsSubmitting(false);
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length < 6) {
      setErrors({ otp: "Please enter the full 6-digit OTP." });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const success = await confirmPasswordReset(
      customerId,
      email,
      oldPassword,
      newPassword,
      otpString
    );

    if (success) {
      if (otpToastIdRef.current) {
        toast.dismiss(otpToastIdRef.current);
        otpToastIdRef.current = null;
      }
      router.push("/auth/login");
    } else {
      setErrors({ otp: "Invalid OTP. Please try again." });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center bg-white px-6 py-12 transition-colors duration-300 dark:bg-slate-950 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="mx-auto h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800">
          <span className="text-3xl font-bold leading-none text-white">V</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Reset Your Vault Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Verify your identity with customer ID, email, password, and a secure OTP.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
        {step === 1 ? (
          <form className="space-y-5" onSubmit={handleRequestOTP}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Customer ID"
                type="text"
                id="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value.replace(/\D/g, ""))}
                error={errors.customerId}
                placeholder="1234567890"
                required
              />

              <Input
                label="Email Address"
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                autoComplete="email"
                required
              />
            </div>

            <Input
              label="Old Password"
              type="password"
              id="oldPassword"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              error={errors.oldPassword}
              autoComplete="current-password"
              required
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="New Password"
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={errors.password}
                autoComplete="new-password"
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmpassword}
                autoComplete="new-password"
                required
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
            </p>

            <Button type="submit" className="h-12 w-full text-base" size="lg" isLoading={isSubmitting}>
              Request Reset OTP
            </Button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleConfirmReset}>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-center dark:border-blue-900/40 dark:bg-blue-950/20">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Enter the OTP for <span className="font-semibold text-slate-900 dark:text-white">{customerId}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{email}</p>
            </div>

            <div className="space-y-4">
              <label className="block text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                Enter Password Reset OTP
              </label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    id={`reset-otp-${index}`}
                    name={`reset-otp-${index}`}
                    type="number"
                    maxLength={1}
                    className={`h-12 w-10 rounded-lg text-center text-xl font-bold shadow-sm transition-all [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-blue-500 sm:h-14 sm:w-12 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                      errors.otp ? "border-red-500 ring-red-500" : "border-gray-300 dark:border-slate-700"
                    } bg-white text-gray-900 dark:bg-slate-950 dark:text-white`}
                    onPaste={onOTPPaste(index)}
                    onChange={onOTPEnter(index)}
                    onKeyDown={onOTPKeyDown(index)}
                    value={otp[index]}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
              {errors.otp && (
                <p className="text-center text-sm text-red-600 dark:text-red-400">{errors.otp}</p>
              )}
            </div>

            <Button type="submit" className="h-12 w-full text-base" size="lg" isLoading={isSubmitting}>
              Confirm Password Change
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  if (otpToastIdRef.current) {
                    toast.dismiss(otpToastIdRef.current);
                    otpToastIdRef.current = null;
                  }
                  setStep(1);
                }}
                className="font-medium text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                &larr; Back to Reset Form
              </button>
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-500">
          Remembered your password?{" "}
          <Link href="/auth/login" className="font-semibold leading-6 text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
