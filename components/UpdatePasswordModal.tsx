import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface UpdatePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: string;
    email: string;
}

export function UpdatePasswordModal({
    isOpen,
    onClose,
    customerId,
    email,
}: UpdatePasswordModalProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [oldPassword, setOldPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    // Password checks
    const hasMinLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    const isPasswordStrong = hasMinLength && hasUpper && hasLower && hasSpecial;

    const handleSendOTP = async () => {
        if (!oldPassword) return toast.error("Enter current password");
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    process: "generateotp",
                    customerId,
                    email,
                    oldPassword,
                    newPassword: "TempPassword123!",
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setStep(2);
            } else {
                toast.error(data.message || "Failed to generate OTP");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) return toast.error("Enter 6-digit OTP");
        setStep(3);
    };

    const handleUpdatePassword = async () => {
        if (!isPasswordStrong)
            return toast.error("Password doesn't meet requirements");
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    process: "verifyotp",
                    customerId,
                    email,
                    oldPassword,
                    newPassword,
                    otp,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                onClose();
            } else {
                toast.error(data.message || "Failed to update password");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-slate-800">
                <h2 className="text-xl font-bold mb-4">Update Password</h2>

                {step === 1 && (
                    <div className="space-y-4">
                        <Input
                            type="password"
                            label="Current Password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSendOTP}
                                isLoading={isSubmitting}
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Enter the OTP sent to your email.
                        </p>
                        <Input
                            type="text"
                            label="6-Digit OTP"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                            >
                                Back
                            </Button>
                            <Button onClick={handleVerifyOTP}>Verify</Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <Input
                            type="password"
                            label="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <div className="space-y-1 text-sm">
                            <p
                                className={
                                    hasMinLength
                                        ? "text-green-500"
                                        : "text-gray-500"
                                }
                            >
                                ✓ 8+ characters
                            </p>
                            <p
                                className={
                                    hasUpper
                                        ? "text-green-500"
                                        : "text-gray-500"
                                }
                            >
                                ✓ 1 Uppercase
                            </p>
                            <p
                                className={
                                    hasLower
                                        ? "text-green-500"
                                        : "text-gray-500"
                                }
                            >
                                ✓ 1 Lowercase
                            </p>
                            <p
                                className={
                                    hasSpecial
                                        ? "text-green-500"
                                        : "text-gray-500"
                                }
                            >
                                ✓ 1 Special character
                            </p>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setStep(2)}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleUpdatePassword}
                                disabled={!isPasswordStrong}
                                isLoading={isSubmitting}
                            >
                                Update
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
