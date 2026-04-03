"use client";

import { useActionState } from "react";
import { depositFunds, withdrawFunds, adminTransfer } from "@/app/actions/admin";
import { SubmitButton } from "@/components/SubmitButton";

function SuccessAwareLedgerForm({
  title,
  description,
  action,
  fields,
  submitLabel,
}: {
  title: string;
  description: string;
  action: (state: string | null, formData: FormData) => Promise<string | null>;
  fields: { id: string; name: string; label: string; placeholder: string; type?: string }[];
  submitLabel: string;
}) {
  // Use a sentinel to distinguish "not yet submitted" (initial) from "success" (null after submit).
  const [result, formAction] = useActionState<string | null, FormData>(action, "unsubmitted");

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 mb-4">{description}</p>

      <form action={formAction} className="space-y-3">
        {fields.map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="block text-xs font-medium text-gray-600 mb-1">
              {f.label}
            </label>
            <input
              id={f.id}
              name={f.name}
              type={f.type ?? "text"}
              required
              placeholder={f.placeholder}
              min={f.type === "number" ? "0.01" : undefined}
              step={f.type === "number" ? "0.01" : undefined}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}

        {result === null && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-md px-3 py-2 text-sm">
            ✅ Operation completed successfully.
          </div>
        )}
        {result !== null && result !== "unsubmitted" && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm">
            {result}
          </div>
        )}

        <SubmitButton label={submitLabel} loadingLabel="Processing…" />
      </form>
    </div>
  );
}

export default function LedgerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Ledger Actions</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SuccessAwareLedgerForm
          title="💰 Deposit"
          description="Credit funds to a customer's account."
          action={depositFunds}
          submitLabel="Deposit"
          fields={[
            {
              id: "deposit-account",
              name: "accountNumber",
              label: "Account Number",
              placeholder: "1234567890",
            },
            {
              id: "deposit-amount",
              name: "amount",
              label: "Amount ($)",
              placeholder: "100.00",
              type: "number",
            },
          ]}
        />

        <SuccessAwareLedgerForm
          title="💸 Withdrawal"
          description="Debit funds from a customer's account."
          action={withdrawFunds}
          submitLabel="Withdraw"
          fields={[
            {
              id: "withdraw-account",
              name: "accountNumber",
              label: "Account Number",
              placeholder: "1234567890",
            },
            {
              id: "withdraw-amount",
              name: "amount",
              label: "Amount ($)",
              placeholder: "100.00",
              type: "number",
            },
          ]}
        />

        <div className="md:col-span-2">
          <SuccessAwareLedgerForm
            title="🔄 Administrative Transfer"
            description="Transfer funds between any two customer accounts."
            action={adminTransfer}
            submitLabel="Transfer"
            fields={[
              {
                id: "transfer-sender",
                name: "senderAccount",
                label: "Sender Account Number",
                placeholder: "1234567890",
              },
              {
                id: "transfer-receiver",
                name: "receiverAccount",
                label: "Receiver Account Number",
                placeholder: "0987654321",
              },
              {
                id: "transfer-amount",
                name: "amount",
                label: "Amount ($)",
                placeholder: "100.00",
                type: "number",
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
