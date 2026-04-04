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
  // Removed accessToken since apiFetch handles it natively
  const { apiFetch, requireAuth } = useAuthContext();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountNumber, setToAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  // Account Request & KYC Modal State
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);
  const [kycStatus, setKycStatus] = useState<"idle" | "pending">("idle");
  const [newAccountType, setNewAccountType] = useState("Savings");
  
  // File & Document Data States
  const [panFile, setPanFile] = useState<File | null>(null);
  const [panNumber, setPanNumber] = useState("");
  
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [aadharNumber, setAadharNumber] = useState("");
  
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  requireAuth("/auth/login");

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          setFromAccountId(data.accounts[0]._id); 
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
        setIsTransferModalOpen(false);
        setToAccountNumber("");
        setAmount("");
        setMemo("");
        alert(`Transfer Successful! Ref ID: ${data.referenceId}`); 
        fetchAccounts();
      }
    } catch (err) {
      setTransferError("A network error occurred. Please try again.");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleRequestAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panFile || !signatureFile || !aadharFile) {
        alert("Please upload your PAN Card, Aadhar Card, and Signature.");
        return;
    }
    
    setIsSubmittingKYC(true);

    try {
        const formData = new FormData();
        formData.append("accountType", newAccountType);
        formData.append("panNumber", panNumber);
        formData.append("aadharNumber", aadharNumber);
        
        formData.append("panCard", panFile);
        formData.append("aadhar", aadharFile);
        formData.append("signature", signatureFile);

        // Using apiFetch instead of native fetch!
        const response = await apiFetch("/api/account-requests", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to submit request");
        }

        setKycStatus("pending");
        
    } catch (error: any) {
        console.error("Failed to submit KYC:", error);
        alert(error.message || "Failed to submit account request.");
    } finally {
        setIsSubmittingKYC(false);
    }
  };

  const closeKycModal = () => {
    if (!isSubmittingKYC) {
        setIsNewAccountModalOpen(false);
        setTimeout(() => setKycStatus("idle"), 300); 
        setPanFile(null);
        setAadharFile(null);
        setSignatureFile(null);
        setPanNumber("");
        setAadharNumber("");
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Accounts</h1>
          <p className="text-sm text-gray-500">Manage your balances and execute transfers.</p>
        </div>
        <div className="flex gap-3">
            <Button onClick={() => setIsNewAccountModalOpen(true)} variant="outline">
                Register for New Account
            </Button>
            <Button onClick={() => setIsTransferModalOpen(true)} variant="primary">
                New Transfer
            </Button>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-500 bg-white border border-gray-200 rounded-xl shadow-sm">
            No accounts found. Please register for a new account above.
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

      {/* Account Request & KYC Modal */}
      <Modal
        isOpen={isNewAccountModalOpen}
        onClose={closeKycModal}
        title="Open New Account"
        description={kycStatus === "pending" ? "" : "Please provide your KYC documents to process your request."}
      >
        {kycStatus === "pending" ? (
            <div className="py-8 text-center space-y-4 animate-fade-in">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-4">
                    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">KYC Pending</h3>
                <p className="text-sm text-gray-500 px-4">
                    Your account request and documents have been submitted successfully. Please wait while our compliance team verifies your details.
                </p>
                <div className="pt-6">
                    <Button onClick={closeKycModal} variant="outline" className="w-full">
                        Close Window
                    </Button>
                </div>
            </div>
        ) : (
            <form onSubmit={handleRequestAccount} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                    <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={newAccountType}
                        onChange={(e) => setNewAccountType(e.target.value)}
                        disabled={isSubmittingKYC}
                    >
                        <option value="Savings">Savings Account</option>
                        <option value="Current">Current Account</option>
                        <option value="Fixed">Fixed Deposit</option>
                    </select>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4 max-h-[50vh] overflow-y-auto">
                    <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Mandatory KYC Details</h4>
                    
                    {/* PAN Input Group */}
                    <div className="space-y-3 pb-4 border-b border-gray-200">
                        <Input
                            label="PAN Number"
                            type="text"
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                            required
                            disabled={isSubmittingKYC}
                            placeholder="ABCDE1234F"
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PAN Card Image</label>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setPanFile(e.target.files?.[0] || null)}
                                required
                                disabled={isSubmittingKYC}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Aadhar Input Group */}
                    <div className="space-y-3 pb-4 border-b border-gray-200">
                        <Input
                            label="Aadhar Number"
                            type="text"
                            value={aadharNumber}
                            onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, ''))}
                            required
                            disabled={isSubmittingKYC}
                            placeholder="1234 5678 9012"
                            maxLength={12}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Card Image</label>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setAadharFile(e.target.files?.[0] || null)}
                                required
                                disabled={isSubmittingKYC}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Signature Input Group */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Signature Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                            required
                            disabled={isSubmittingKYC}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 mt-6">
                    <Button type="button" variant="ghost" onClick={closeKycModal} disabled={isSubmittingKYC}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={isSubmittingKYC}>
                        Submit Documents
                    </Button>
                </div>
            </form>
        )}
      </Modal>

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
            onChange={(e) => setToAccountNumber(e.target.value.replace(/\D/g, ''))}
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