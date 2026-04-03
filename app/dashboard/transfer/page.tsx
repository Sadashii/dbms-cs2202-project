"use client";

import { useActionState } from "react";
import { transferFunds } from "@/app/actions/customer";
import { SubmitButton } from "@/components/SubmitButton";

export default function TransferPage() {
  const [result, formAction] = useActionState(transferFunds, null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Transfer Funds</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-lg">
        <p className="text-sm text-gray-500 mb-6">
          Enter the recipient&apos;s account number and the amount you wish to transfer.
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="accountNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Recipient Account Number
            </label>
            <input
              id="accountNumber"
              name="accountNumber"
              type="text"
              required
              placeholder="1234567890"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount ($)
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              required
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {result !== null && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm">
              {result}
            </div>
          )}

          <SubmitButton label="Transfer" loadingLabel="Processing…" />
        </form>
      </div>
    </div>
  );
}
