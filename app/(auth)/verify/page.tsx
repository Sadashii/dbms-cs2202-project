"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyOTP } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import Link from "next/link";
import { Suspense } from "react";

function VerifyForm() {
  const [error, formAction] = useActionState(verifyOTP, null);
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
      <div className="text-center mb-6">
        <span className="text-4xl">🔐</span>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Enter OTP</h1>
        <p className="text-gray-500 text-sm mt-1">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-gray-700">{email}</span>
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />

        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
            One-Time Password
          </label>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            placeholder="123456"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <SubmitButton label="Verify OTP" loadingLabel="Verifying…" />
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        Wrong email?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Go back
        </Link>
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading…</div>}>
        <VerifyForm />
      </Suspense>
    </main>
  );
}
