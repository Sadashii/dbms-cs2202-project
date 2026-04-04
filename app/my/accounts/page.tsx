"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

interface Account {
  _id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  currentStatus: string;
}

export default function AccountsPage() {
  const { apiFetch, requireAuth } = useAuthContext();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");
  
  // Form State
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountNumber, setToAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  requireAuth("/auth/login");

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          setFromAccountId(data.accounts[0]._id); // Default to first account
        }
      }
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [apiFetch]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError("");
    setIsTransferring(true);

    try {
      const res = await apiFetch("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          fromAccountId,
          toAccountNumber,
          amount: parseFloat(amount),
          memo
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTransferError(data.message || "Transfer failed.");
      } else {
        // Success! Reset form, close modal, and refresh accounts
        setIsTransferModalOpen(false);
        setToAccountNumber("");
        setAmount("");
        setMemo("");
        alert(`Transfer Successful! Ref ID: ${data.referenceId}`); // Replace with Toast
        fetchAccounts();
      }
    } catch (err) {
      setTransferError("A network error occurred. Please try again.");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Accounts</h1>
          <p className="text-sm text-gray-500">Manage your balances and execute transfers.</p>
        </div>
        <Button onClick={() => setIsTransferModalOpen(true)} variant="primary">
          New Transfer
        </Button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-500 bg-white border border-gray-200 rounded-xl shadow-sm">
            No accounts found. Please contact support to open an account.
          </div>
        ) : (
          accounts.map((acc) => (
            <div key={acc._id} className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 relative">
              {acc.currentStatus !== 'Active' && (
                <div className="absolute top-0 right-0 bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-bl-lg z-10">
                  {acc.currentStatus}
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{acc.accountType}</h3>
                    <p className="text-sm font-mono text-gray-500">{acc.accountNumber}</p>
                  </div>
                  <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                    <span className="text-blue-700 font-bold text-xs">{acc.currency}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Available Balance</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {acc.currency === 'INR' ? '₹' : acc.currency === 'USD' ? '$' : '€'}
                    {acc.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Money Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => !isTransferring && setIsTransferModalOpen(false)}
        title="Transfer Funds"
        description="Securely transfer money to any internal account."
      >
        <form onSubmit={handleTransfer} className="space-y-4">
          {transferError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
              {transferError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm outline-none"
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              required
              disabled={isTransferring}
            >
              {accounts.filter(a => a.currentStatus === 'Active').map(acc => (
                <option key={acc._id} value={acc._id}>
                  {acc.accountType} (****{acc.accountNumber.slice(-4)}) - {acc.currency} {acc.balance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Recipient Account Number"
            type="text"
            value={toAccountNumber}
            onChange={(e) => setToAccountNumber(e.target.value.replace(/\D/g, ''))} // Numbers only
            required
            disabled={isTransferring}
            placeholder="e.g., 0987654321"
          />

          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={isTransferring}
            placeholder="0.00"
          />

          <Input
            label="Memo (Optional)"
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            disabled={isTransferring}
            placeholder="e.g., Rent Payment"
            maxLength={50}
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 mt-6">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsTransferModalOpen(false)}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isTransferring}>
              Confirm Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}