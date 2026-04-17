"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { ReuploadModal } from "@/components/ReuploadModal";

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
  const { apiFetch, isLoading: authLoading, isLoggedIn } = useAuthContext();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [kycs, setKycs] = useState<any[]>([]); // New state for KYC document status
  const [accountRequests, setAccountRequests] = useState<any[]>([]); // Changed to handle list of requests
  const [schedules, setSchedules] = useState<any[]>([]);

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountNumber, setToAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [beneficiaryNickName, setBeneficiaryNickName] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [frequency, setFrequency] = useState("Monthly");
  const [startDate, setStartDate] = useState("");

  // Account Request & KYC Modal State
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);
  const [kycStatus, setKycStatus] = useState<"idle" | "pending">("idle");
  const [newAccountType, setNewAccountType] = useState("Savings");
  
  // Branch Selection State
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [branchSearch, setBranchSearch] = useState("");
  
  // Reupload Modal State
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [reuploadDocType, setReuploadDocType] = useState("");

  // File & Document Data States
  const [panFile, setPanFile] = useState<File | null>(null);
  const [panNumber, setPanNumber] = useState("");
  
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [aadharNumber, setAadharNumber] = useState("");
  
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/auth/login");
  }, [authLoading, isLoggedIn, router]);

  const fetchAccounts = async (p = page) => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/accounts?page=${p}&limit=9`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? data.accounts.length);
        if (data.accounts.length > 0 && !fromAccountId) {
          setFromAccountId(data.accounts[0]._id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKycs = async () => {
    try {
      const res = await apiFetch("/api/kyc");
      if (res.ok) {
        const data = await res.json();
        setKycs(data.documents || []);
        setAccountRequests(data.requests || []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchBeneficiaries = async () => {
    try {
      const res = await apiFetch("/api/beneficiaries");
      if (res.ok) {
        const data = await res.json();
        setBeneficiaries(data.beneficiaries || []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchSchedules = async () => {
    try {
      const res = await apiFetch("/api/scheduledpayments");
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules || []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchBranches = async () => {
    try {
      const res = await apiFetch("/api/admin/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      }
    } catch (e) {
      console.error("Failed to fetch branches:", e);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchAccounts(page);
      fetchKycs();
      fetchBeneficiaries();
      fetchSchedules();
      fetchBranches();
    }
  }, [apiFetch, page, isLoggedIn]);

  const fetchHistory = (account: Account) => {
    router.push(`/my/accounts/${account._id}`);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError("");
    setIsTransferring(true);

    try {
      if (isScheduled) {
         const res = await apiFetch("/api/scheduledpayments", {
           method: "POST",
           body: JSON.stringify({
             fromAccountId,
             toAccountNumber,
             amount: parseFloat(amount),
             memo,
             frequency,
             startDate
           }),
         });
         const data = await res.json();
         if (!res.ok) {
           setTransferError(data.message || "Scheduling failed.");
         } else {
             handleSaveBeneficiaryFlow();
             resetForm("Schedule set successfully!");
             fetchSchedules();
         }
      } else {
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
             handleSaveBeneficiaryFlow();
             resetForm(`Transfer Successful! Ref ID: ${data.referenceId}`);
             fetchAccounts();
         }
      }
    } catch (err) {
      setTransferError("A network error occurred. Please try again.");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleSaveBeneficiaryFlow = async () => {
      if (saveBeneficiary && beneficiaryNickName) {
         await apiFetch("/api/beneficiaries", {
            method: "POST",
            body: JSON.stringify({
                nickName: beneficiaryNickName,
                accountNumber: toAccountNumber,
                accountName: "VaultPay User" 
            })
         });
         fetchBeneficiaries();
      }
  };

  const resetForm = (successMessage: string) => {
      setIsTransferModalOpen(false);
      setToAccountNumber("");
      setAmount("");
      setMemo("");
      setBeneficiaryNickName("");
      setSaveBeneficiary(false);
      setIsScheduled(false);
      setStartDate("");
      toast.success(successMessage);
  };

  const updateScheduleStatus = async (scheduleId: string, currentStatus: string) => {
      try {
          const res = await apiFetch("/api/scheduledpayments", {
              method: "PATCH",
              body: JSON.stringify({ scheduleId, currentStatus })
          });
          if (res.ok) {
              toast.success(`Schedule ${currentStatus.toLowerCase()} successfully.`);
              fetchSchedules();
          }
      } catch (e) {
          toast.error("Failed to update schedule status.");
      }
  };

    const handleRequestAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panFile && !signatureFile && !aadharFile) {
        toast.error("Please upload the documents you wish to submit.");
        return;
    }
    
    setIsSubmittingKYC(true);

    try {
        const formData = new FormData();
        formData.append("accountType", newAccountType);
        formData.append("panNumber", panNumber);
        formData.append("aadharNumber", aadharNumber);
        if (selectedBranchId) formData.append("branchId", selectedBranchId);
        
        if (panFile) formData.append("panCard", panFile);
        if (aadharFile) formData.append("aadhar", aadharFile);
        if (signatureFile) formData.append("signature", signatureFile);

        // Detect if this is a remediation (PATCH) or a new request (POST)
        const method = "POST"; // New request is always POST from this modal

        const response = await apiFetch("/api/account-requests", {
            method: method,
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to submit request");
        }

        toast.success("Registration submitted successfully.");
        setKycStatus("pending");
        fetchKycs(); // Refresh status tracking
        
    } catch (error: any) {
        console.error("Failed to submit KYC:", error);
        toast.error(error.message || "Failed to submit account request.");
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

      {/* KYC & Account Requests Status Tracking */}
      {accountRequests.length > 0 && accountRequests.some(r => r.currentStatus !== 'Approved') && (
          <div className="space-y-6">
              {accountRequests.filter(r => r.currentStatus !== 'Approved').map(request => (
                  <div key={request._id} className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm mb-6">
                      <div className="flex items-center justify-between mb-4">
                          <div>
                              <h2 className="text-lg font-bold text-blue-900">Account Request Status: {request.currentStatus.replace('_', ' ')}</h2>
                              <p className="text-sm text-blue-700">Tracking progress for your {request.accountType} account.</p>
                          </div>
                          <div className="flex gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${request.currentStatus === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {request.currentStatus}
                              </span>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {['PAN', 'Aadhar', 'Signature'].map(type => {
                              const kyc = kycs.find(k => k.documentType === type && k.userId === request.userId); // userId simplified for now
                              const status = kyc?.currentStatus || 'Not Submitted';
                              
                              return (
                                  <div key={type} className="bg-white p-4 rounded-lg border border-blue-100 flex flex-col justify-between">
                                      <div>
                                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">{type} Document</p>
                                          <div className="flex items-center gap-2">
                                              <span className={`w-2 h-2 rounded-full ${status === 'Verified' ? 'bg-green-500' : status === 'Rejected' ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                                              <p className="text-sm font-semibold text-gray-900">{status}</p>
                                          </div>
                                      </div>
                                      {status === 'Rejected' && (
                                          <div className="mt-3">
                                              <p className="text-[10px] text-red-600 mb-2">{kyc?.metadata?.rejectionReason || "Please re-upload clear image."}</p>
                                              <Button variant="outline" size="sm" className="w-full text-[10px] py-1 h-auto" onClick={() => {
                                                  setReuploadDocType(type);
                                                  setIsReuploadModalOpen(true);
                                              }}>
                                                  Fix & Re-upload
                                              </Button>
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white border border-dashed border-gray-200 rounded-xl shadow-sm">
            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No accounts yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">Submit your KYC documents to get started. Our team typically reviews applications within 1 business day.</p>
            <Button onClick={() => setIsNewAccountModalOpen(true)} variant="primary">
              Register for New Account
            </Button>
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
                  <p className="text-3xl font-bold text-gray-900 mb-4">
                    {acc.currency === 'INR' ? '₹' : acc.currency === 'USD' ? '$' : '€'}
                    {acc.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  
                  <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full text-xs shadow-none py-1.5 h-auto text-gray-600" onClick={() => fetchHistory(acc)}>
                        History
                    </Button>
                    <Button variant="outline" className="w-full text-xs shadow-none py-1.5 h-auto text-blue-600 border-blue-100 hover:bg-blue-50" onClick={() => router.push(`/my/accounts/statement/${acc._id}`)}>
                        Statement
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-sm">
          <p className="text-sm text-gray-500">
            {total} account{total !== 1 ? "s" : ""} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="py-1 h-auto text-xs"
            >
              ← Previous
            </Button>
            <span className="text-sm text-gray-600 px-2">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="py-1 h-auto text-xs"
            >
              Next →
            </Button>
          </div>
        </div>
      )}
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

      {schedules.length > 0 && (
          <div className="mb-6 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Scheduled Transfers</h2>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Schedule Detail</th>
                              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Frequency</th>
                              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Next Payment</th>
                              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                              <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                          {schedules.map(sch => (
                              <tr key={sch._id} className="hover:bg-gray-50/50">
                                  <td className="p-4">
                                      <div className="font-bold text-gray-900">{sch.currency} {sch.amount.$numberDecimal || sch.amount}</div>
                                      <div className="text-xs text-gray-500">To: {sch.beneficiaryId || "Saved Payee"}</div>
                                  </td>
                                  <td className="p-4">
                                      <div className="text-sm font-medium text-gray-900">{sch.frequency}</div>
                                  </td>
                                  <td className="p-4 text-sm text-gray-600">
                                      {new Date(sch.nextRunDate).toLocaleDateString()}
                                  </td>
                                  <td className="p-4">
                                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${sch.currentStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : sch.currentStatus === 'Paused' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                          {sch.currentStatus}
                                      </span>
                                  </td>
                                  <td className="p-4 text-right">
                                      {sch.currentStatus !== 'Cancelled' && (
                                          <div className="flex justify-end gap-2">
                                              <Button type="button" variant="outline" size="sm" className="text-xs py-1 h-auto" onClick={() => updateScheduleStatus(sch._id, sch.currentStatus === 'Active' ? 'Paused' : 'Active')}>
                                                  {sch.currentStatus === 'Active' ? 'Pause' : 'Resume'}
                                              </Button>
                                              <Button type="button" variant="outline" size="sm" className="text-xs py-1 h-auto text-red-600 hover:bg-red-50" onClick={() => updateScheduleStatus(sch._id, 'Cancelled')}>
                                                  Cancel
                                              </Button>
                                          </div>
                                      )}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Account</label>
            <div className="space-y-3">
                {beneficiaries.length > 0 && (
                    <select
                        className="w-full border border-blue-200 rounded-md px-3 py-2 bg-blue-50 text-blue-800 text-sm focus:ring-blue-500 outline-none"
                        onChange={(e) => {
                            const b = beneficiaries.find(x => x._id === e.target.value);
                            if (b) {
                                setToAccountNumber(b.accountNumber);
                                setBeneficiaryNickName(b.nickName);
                            }
                        }}
                        disabled={isTransferring}
                    >
                        <option value="">Select Saved Payee (Optional)</option>
                        {beneficiaries.map(b => (
                            <option key={b._id} value={b._id}>{b.nickName} - {b.accountNumber}</option>
                        ))}
                    </select>
                )}
                <Input
                    type="text"
                    value={toAccountNumber}
                    onChange={(e) => {
                        setToAccountNumber(e.target.value.replace(/\D/g, ''));
                        // Reset selection if typing manually
                        setSaveBeneficiary(true);
                    }}
                    required
                    disabled={isTransferring}
                    placeholder="Enter recipient account number"
                />
            </div>
          </div>

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

          {!beneficiaries.some(b => b.accountNumber === toAccountNumber) && toAccountNumber && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                  <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="save-ben" 
                        checked={saveBeneficiary} 
                        onChange={(e) => setSaveBeneficiary(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="save-ben" className="text-sm font-medium text-gray-700">Save this Payee for later?</label>
                  </div>
                  {saveBeneficiary && (
                       <Input
                        label="Payee Nickname"
                        type="text"
                        value={beneficiaryNickName}
                        onChange={(e) => setBeneficiaryNickName(e.target.value)}
                        placeholder="e.g., Landlord"
                        maxLength={20}
                        required
                    />
                  )}
              </div>
          )}

          <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-3">
              <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="schedule-transfer" 
                    checked={isScheduled} 
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 border-blue-300 w-4 h-4"
                  />
                  <label htmlFor="schedule-transfer" className="text-sm font-medium text-blue-800">Schedule this transfer (Recurring)</label>
              </div>
              {isScheduled && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                          <label className="block text-xs font-medium text-blue-700 mb-1">Frequency</label>
                          <select 
                            className="w-full border border-blue-200 rounded-md px-3 py-1.5 bg-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            required
                          >
                              <option value="Once">Once Later</option>
                              <option value="Daily">Daily</option>
                              <option value="Weekly">Weekly</option>
                              <option value="Monthly">Monthly</option>
                              <option value="Quarterly">Quarterly</option>
                              <option value="Yearly">Yearly</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-blue-700 mb-1">Start / Execution Date</label>
                          <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              required={isScheduled}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full border border-blue-200 rounded-md px-3 py-1.5 bg-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                      </div>
                  </div>
              )}
          </div>

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
      <ReuploadModal 
        isOpen={isReuploadModalOpen} 
        onClose={() => setIsReuploadModalOpen(false)} 
        documentType={reuploadDocType} 
        onSuccess={fetchKycs} 
      />
    </div>
  );
}