"use client";

import { useActionState } from "react";
import { createCustomer, type CreateCustomerResult } from "@/app/actions/admin";
import { SubmitButton } from "@/components/SubmitButton";

// Sentinel value to distinguish "not yet submitted" from a real null/success state.
const UNSUBMITTED: CreateCustomerResult = { ok: false, error: "" };

export default function CustomersPage() {
  const [result, formAction] = useActionState<CreateCustomerResult, FormData>(
    createCustomer,
    UNSUBMITTED
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Customer Management</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-lg">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Create New Customer</h2>
        <p className="text-sm text-gray-500 mb-6">
          Fill in the details below to open a new customer account. The customer will receive a
          welcome email with their account number.
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Jane Doe"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="jane@example.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Balance ($)
            </label>
            <input
              id="initialBalance"
              name="initialBalance"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {result?.ok === true && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-md px-3 py-2 text-sm">
              ✅ Customer created. Account number:{" "}
              <span className="font-mono font-semibold">{result.accountNumber}</span>
            </div>
          )}
          {result?.ok === false && result.error !== "" && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm">
              {result.error}
            </div>
          )}

          <SubmitButton label="Create Customer" loadingLabel="Creating…" />
        </form>
      </div>
    </div>
  );
}
