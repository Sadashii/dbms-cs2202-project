"use client";

import { useActionState } from "react";
import { requestOTP } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

export default function LoginPage() {
  const [error, formAction] = useActionState(requestOTP, null);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-4xl">🏦</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Banking Platform</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email to receive an OTP</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <SubmitButton label="Send OTP" loadingLabel="Sending…" />
        </form>
      </div>
    </main>
  );
}
