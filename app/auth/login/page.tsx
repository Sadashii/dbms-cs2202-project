"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthContext } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { getLoginOTP, verifyLogin, isLoggedIn } = useAuthContext();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; otp?: string }>({});
  const otpToastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/my/overview");
    }
  }, [isLoggedIn, router]);

  // --- OTP Input Handlers ---
  const onOTPPaste = (input_index: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    if (!/^\d+$/.test(pastedData)) return;

    setOtp(state => {
      const new_otp = [...state];
      for (let i = 0; i < pastedData.length; i++) {
        if (input_index + i < new_otp.length) {
          new_otp[input_index + i] = pastedData[i];
        }
      }
      
      setTimeout(() => {
        document.getElementById(`otp-${Math.min(input_index + pastedData.length, new_otp.length - 1)}`)?.focus();
      }, 0);
      
      return new_otp;
    });
  };

  const onOTPEnter = (input_index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const char = val.slice(-1);

    if (char && !/^\d$/.test(char)) return;

    setOtp(state => {
      const new_otp = [...state];
      new_otp[input_index] = char;
      return new_otp;
    });

    if (char && input_index < 5) {
      setTimeout(() => {
        document.getElementById(`otp-${input_index + 1}`)?.focus();
      }, 0);
    }
  };

  const onOTPKeyDown = (input_index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[input_index] === '') {
      e.preventDefault(); 
      if (input_index > 0) {
        document.getElementById(`otp-${input_index - 1}`)?.focus();
      }
    }        
  };

  const showOtpToast = (otpCode: string, targetLabel: string) => {
    if (otpToastIdRef.current) {
      toast.dismiss(otpToastIdRef.current);
    }

    const toastId = toast.custom(
      (t) => (
        <div
          className={`w-[min(92vw,26rem)] rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl shadow-blue-100/60 transition-all duration-200 dark:border-blue-900/50 dark:bg-slate-900 dark:shadow-black/30 ${
            t.visible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-2 opacity-0 scale-95"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                Login OTP
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
                Use this code to continue
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Sent for <span className="font-medium text-slate-900 dark:text-white">{targetLabel}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Dismiss OTP toast"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M5 5l10 10M15 5 5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
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
              This code expires quickly. Do not share it.
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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      nextErrors.identifier = "Enter your email address or customer ID.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const result = await getLoginOTP(identifier, password);
    if (result.success) {
      if (result.otp) {
        showOtpToast(result.otp, identifier);
      } else if (result.message) {
        toast.success(result.message);
      }
      setStep(2);
      setTimeout(() => {
        document.getElementById('otp-0')?.focus();
      }, 100);
    }
    setIsSubmitting(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setErrors({ otp: "Please complete the 6-digit OTP." });
      return;
    }
    
    setErrors({});
    setIsSubmitting(true);

    const success = await verifyLogin(identifier, password, otpString);
    if (success) {
      if (otpToastIdRef.current) {
        toast.dismiss(otpToastIdRef.current);
        otpToastIdRef.current = null;
      }
      router.push("/my/overview");
    } else {
      setErrors({ otp: "Invalid OTP. Please try again." });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800">
          <span className="text-white font-bold text-3xl leading-none">V</span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white transition-colors">
          Sign in to your Vault
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm bg-white dark:bg-slate-900 p-8 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all">
        {step === 1 ? (
          <form className="space-y-6" onSubmit={handleSendOTP}>
            <Input
              label="Email or Customer ID"
              type="text"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              error={errors.identifier}
              autoComplete="username"
              required
            />

            <Input
              label="Password"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
              required
            />

            <div className="-mt-2 text-right">
              <Link
                href="/auth/reset-password"
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot password? Click here to reset it
              </Link>
            </div>

            <div>
              <Button type="submit" className="w-full h-12 text-base" size="lg" isLoading={isSubmitting}>
                Secure Login
              </Button>
            </div>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleVerifyOTP}>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
              We've sent a 6-digit verification code to <br/>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{identifier}</span>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                Enter Secure Code
              </label>
              <div className="flex gap-2 sm:gap-3 justify-center">
                {([0, 1, 2, 3, 4, 5]).map(index => (
                  <input 
                    key={index}
                    id={`otp-${index}`}
                    name={`otp-${index}`}
                    type="number"
                    maxLength={1}
                    className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none 
                    bg-white dark:bg-slate-950 text-gray-900 dark:text-white
                    ${errors.otp ? "border-red-500 ring-red-500" : "border-gray-300 dark:border-slate-700"} `}
                    onPaste={onOTPPaste(index)}
                    onChange={onOTPEnter(index)}
                    onKeyDown={onOTPKeyDown(index)}
                    value={otp[index]}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
              {errors.otp && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center animate-fade-in">
                  {errors.otp}
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full h-12 text-base" size="lg" isLoading={isSubmitting}>
                Verify & Enter
              </Button>
            </div>
            
            <div className="text-center mt-4 text-sm">
              <button 
                type="button" 
                onClick={() => {
                  if (otpToastIdRef.current) {
                    toast.dismiss(otpToastIdRef.current);
                    otpToastIdRef.current = null;
                  }
                  setStep(1);
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium transition-colors"
              >
                &larr; Back to Email/Password
              </button>
            </div>
          </form>
        )}

        <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-500">
          Not a member yet?{" "}
          <Link href="/auth/signup" className="font-semibold leading-6 text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors">
            Create New Account
          </Link>
        </p>
      </div>
    </div>
  );
}
