"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { getLoginOTP, verifyLogin, verifyConstraints, isLoggedIn } = useAuthContext();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // OTP array state matching your original logic
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  
  // Error State
  const [errors, setErrors] = useState<{ email?: string; password?: string; otp?: string }>({});

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/my/overview");
    }
  }, [isLoggedIn, router]);

  // --- OTP Input Handlers (Adapted from your inspiration) ---
  const onOTPPaste = (input_index: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    if (!/^\d+$/.test(pastedData)) return; // Only allow numbers

    setOtp(state => {
      const new_otp = [...state];
      for (let i = 0; i < pastedData.length; i++) {
        if (input_index + i < new_otp.length) {
          new_otp[input_index + i] = pastedData[i];
        }
      }
      
      // Auto-focus the next empty input or the last input
      setTimeout(() => {
        document.getElementById(`otp-${Math.min(input_index + pastedData.length, new_otp.length - 1)}`)?.focus();
      }, 0);
      
      return new_otp;
    });
  };

  const onOTPEnter = (input_index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const char = val.slice(-1);

    // Only allow digits
    if (char && !/^\d$/.test(char)) return;

    setOtp(state => {
      const new_otp = [...state];
      new_otp[input_index] = char;
      return new_otp;
    });

    // Auto-advance to next input
    if (char && input_index < 5) {
      setTimeout(() => {
        document.getElementById(`otp-${input_index + 1}`)?.focus();
      }, 0);
    }
  };

  const onOTPKeyDown = (input_index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to auto-focus previous input
    if (e.key === 'Backspace' && otp[input_index] === '') {
      e.preventDefault(); 
      if (input_index > 0) {
        document.getElementById(`otp-${input_index - 1}`)?.focus();
      }
    }        
  };

  // --- Submit Handlers ---
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Inputs locally before hitting the API
    const validation = verifyConstraints({
      email: { value: email },
      password: { value: password }
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    const success = await getLoginOTP(email, password);
    if (success) {
      setStep(2);
      // Auto focus the first OTP box when entering step 2
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

    const success = await verifyLogin(email, password, otpString);
    if (success) {
      router.push("/my/overview"); // Navigate to secure dashboard on success
    } else {
      setErrors({ otp: "Invalid OTP. Please try again." });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-3xl leading-none">V</span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Sign in to your Vault
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm bg-white p-8 border border-gray-200 rounded-xl shadow-sm">
        {step === 1 ? (
          <form className="space-y-6" onSubmit={handleSendOTP}>
            <Input
              label="Email address"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
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

            <div>
              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                Secure Login
              </Button>
            </div>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleVerifyOTP}>
            <div className="text-sm text-gray-600 mb-6 text-center">
              We've sent a 6-digit verification code to <br/>
              <span className="font-semibold text-gray-900">{email}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
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
                    min={0}
                    max={9}
                    className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      errors.otp ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500"
                    }`}
                    onPaste={onOTPPaste(index)}
                    onChange={onOTPEnter(index)}
                    onKeyDown={onOTPKeyDown(index)}
                    value={otp[index]}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
              {errors.otp && (
                <p className="mt-2 text-sm text-red-600 text-center animate-fade-in">
                  {errors.otp}
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                Verify & Enter
              </Button>
            </div>
            
            <div className="text-center mt-4 text-sm">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                &larr; Back to Email/Password
              </button>
            </div>
          </form>
        )}

        <p className="mt-10 text-center text-sm text-gray-500">
          Not a member yet?{" "}
          <Link href="/auth/signup" className="font-semibold leading-6 text-blue-600 hover:text-blue-500 transition-colors">
            Open a Corporate Account
          </Link>
        </p>
      </div>
    </div>
  );
}