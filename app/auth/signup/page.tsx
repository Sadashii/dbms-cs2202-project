"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const router = useRouter();
  const { signup, verifyConstraints, isLoggedIn } = useAuthContext();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Error State
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmpassword?: string }>({});

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/my/overview");
    }
  }, [isLoggedIn, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Run local validation checks
    const validation = verifyConstraints({
      email: { value: email },
      password: { value: password },
      confirmpassword: { value: confirmPassword }
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Clear errors and start loading
    setErrors({});
    setIsSubmitting(true);

    // 2. Call backend signup
    await signup(fullName, email, password);
    
    setIsSubmitting(false);
    // Note: The useAuth hook automatically handles the redirect to /login upon success
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold leading-9 tracking-tight text-gray-900">
          Open a Vault Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Secure, enterprise-grade banking for modern teams.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md bg-white p-8 border border-gray-200 rounded-xl shadow-sm">
        <form className="space-y-5" onSubmit={handleSignup}>
          
          <Input
            label="Legal Full Name"
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
            autoComplete="name"
          />

          <Input
            label="Corporate Email Address"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="john.doe@company.com"
            required
            autoComplete="email"
          />

          <Input
            label="Create Password"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            helperText="At least 8 characters, 1 uppercase, 1 number, 1 special character."
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmpassword}
            required
            autoComplete="new-password"
          />

          <div className="pt-2">
            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              Create Secure Account
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold leading-6 text-blue-600 hover:text-blue-500 transition-colors">
            Sign in to your Vault
          </Link>
        </p>
      </div>
    </div>
  );
}