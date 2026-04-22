"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthContext } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export default function LoginPage() {
    const router = useRouter();
    const { getLoginOTP, verifyLogin, isLoggedIn } = useAuthContext();

    const [step, setStep] = useState<1 | 2>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [is2FA, setIs2FA] = useState(false);

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);

    const [errors, setErrors] = useState<{
        identifier?: string;
        password?: string;
        otp?: string;
    }>({});
    const otpToastIdRef = useRef<string | null>(null);

    const [generatedOtp, setGeneratedOtp] = useState("");
    const [showOtpModal, setShowOtpModal] = useState(false);

    useEffect(() => {
        if (isLoggedIn) {
            router.push("/my/overview");
        }
    }, [isLoggedIn, router]);

    const onOTPPaste =
        (input_index: number) =>
        (e: React.ClipboardEvent<HTMLInputElement>) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData("text/plain");
            if (!/^\d+$/.test(pastedData)) return;

            setOtp((state) => {
                const new_otp = [...state];
                for (let i = 0; i < pastedData.length; i++) {
                    if (input_index + i < new_otp.length) {
                        new_otp[input_index + i] = pastedData[i];
                    }
                }

                setTimeout(() => {
                    document
                        .getElementById(
                            `otp-${Math.min(input_index + pastedData.length, new_otp.length - 1)}`,
                        )
                        ?.focus();
                }, 0);

                return new_otp;
            });
        };

    const onOTPEnter =
        (input_index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            const char = val.slice(-1);

            if (char && !/^\d$/.test(char)) return;

            setOtp((state) => {
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

    const onOTPKeyDown =
        (input_index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Backspace" && otp[input_index] === "") {
                e.preventDefault();
                if (input_index > 0) {
                    document.getElementById(`otp-${input_index - 1}`)?.focus();
                }
            }
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
            if (result.is2FA) {
                setIs2FA(true);
            } else if (result.otp) {
                setIs2FA(false);
                setGeneratedOtp(result.otp);
                setShowOtpModal(true);
            } else if (result.message) {
                toast.success(result.message);
            }
            setStep(2);
            setTimeout(() => {
                document.getElementById("otp-0")?.focus();
            }, 100);
        }
        setIsSubmitting(false);
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpString = otp.join("");
        if (otpString.length < 6) {
            setErrors({ otp: "Please complete the 6-digit OTP." });
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        const success = await verifyLogin(identifier, password, otpString);
        if (success) {
            router.push("/my/overview");
        } else {
            setErrors({ otp: "Invalid OTP. Please try again." });
        }
        setIsSubmitting(false);
    };

    return (
        <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-white dark:bg-slate-950 transition-colors duration-300">
            <Modal
                isOpen={showOtpModal}
                onClose={() => setShowOtpModal(false)}
                title="Login OTP Verification"
                description={`Sent for ${identifier}`}
            >
                <div className="flex flex-col items-center justify-center py-6 space-y-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        For development testing, here is your OTP. In production, this is sent via email/SMS.
                    </p>
                    <div className="text-4xl font-mono tracking-[0.3em] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-6 py-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                        {generatedOtp}
                    </div>
                    <Button onClick={() => setShowOtpModal(false)} className="w-full h-12">Close & Continue Login</Button>
                </div>
            </Modal>

            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800">
                    <span className="text-white font-bold text-3xl leading-none">
                        V
                    </span>
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
                            <Button
                                type="submit"
                                className="w-full h-12 text-base"
                                size="lg"
                                isLoading={isSubmitting}
                            >
                                Secure Login
                            </Button>
                        </div>
                    </form>
                ) : (
                    <form className="space-y-6" onSubmit={handleVerifyOTP}>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
                            {is2FA ? (
                                "Please open your Authenticator app and enter the 6-digit code."
                            ) : (
                                <>
                                    We've sent a 6-digit verification code to{" "}
                                    <br />
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {identifier}
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                                Enter Secure Code
                            </label>
                            <div className="flex gap-2 sm:gap-3 justify-center">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
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
                            <Button
                                type="submit"
                                className="w-full h-12 text-base"
                                size="lg"
                                isLoading={isSubmitting}
                            >
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
                    <Link
                        href="/auth/signup"
                        className="font-semibold leading-6 text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
                    >
                        Create New Account
                    </Link>
                </p>
            </div>
        </div>
    );
}
