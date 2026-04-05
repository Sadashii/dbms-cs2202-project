"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import EmiCalculator from "@/components/EmiCalculator";
import toast from "react-hot-toast";

interface Loan {
  _id: string;
  loanReference: string;
  loanType: string;
  principalAmount: number;
  remainingAmount: number;
  emiAmount: number;
  interestRate: number;
  tenureMonths: number;
  currency: string;
  currentStatus: string;
  nextPaymentDate?: string;
  accountId: string;
}

interface LoanPayment {
  _id: string;
  paymentReference: string;
  amountExpected: number;
  amountPaid: number;
  principalComponent: number;
  interestComponent: number;
  lateFeeComponent: number;
  dueDate: string;
  paidDate?: string;
  currentStatus: string;
}

export default function LoansPage() {
  const { user, apiFetch, isLoading: authLoading, isLoggedIn } = useAuthContext();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Record<string, LoanPayment[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  const [scheduleLoan, setScheduleLoan] = useState<Loan | null>(null);
  const [historyLoan, setHistoryLoan] = useState<Loan | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/auth/login");
  }, [authLoading, isLoggedIn, router]);

  const fetchPayments = async (loanId: string) => {
      try {
          const res = await apiFetch(`/api/loans/payments?loanId=${loanId}`);
          if (res.ok) {
              const data = await res.json();
              setPayments(prev => ({ ...prev, [loanId]: data.payments }));
          }
      } catch (error) {
          console.error("Failed to fetch payments", error);
      }
  };

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/loans");
      if (res.ok) {
        const data = await res.json();
        setLoans(data.loans || []);
        
        // Fetch payments for each active/closed loan
        data.loans.forEach((loan: Loan) => {
          fetchPayments(loan._id);
        });
      }
    } catch (error) {
      console.error("Failed to fetch loans", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
        fetchLoans();
    }
  }, [apiFetch, user]);

  const generateSchedule = (loan: Loan) => {
    let balance = loan.principalAmount;
    const monthlyRate = loan.interestRate / 12 / 100;
    const schedule = [];

    let currentDate = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : new Date();
    if (!loan.nextPaymentDate) {
        currentDate.setMonth(currentDate.getMonth() + 1); 
    }

    for (let i = 1; i <= loan.tenureMonths; i++) {
        const interestForMonth = balance * monthlyRate;
        let principalForMonth = loan.emiAmount - interestForMonth;

        if (i === loan.tenureMonths || balance <= principalForMonth) { 
            principalForMonth = balance;
        }

        balance -= principalForMonth;
        
        const formattedDate = currentDate.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
        
        schedule.push({
            month: i,
            date: formattedDate,
            emi: principalForMonth + interestForMonth,
            principal: principalForMonth,
            interest: interestForMonth,
            balance: Math.max(0, balance)
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return schedule;
  };

  const handleRepay = async (loanId: string, paymentId: string, type: 'EMI' | 'FORECLOSE') => {
      if (isProcessing) return;
      if (!confirm(`Are you sure you want to ${type === 'EMI' ? 'pay your monthly installment' : 'foreclose the entire loan'}?`)) return;

      setIsProcessing(loanId);
      try {
          const res = await apiFetch("/api/loans/repay", {
              method: "POST",
              body: JSON.stringify({ loanId, paymentId, type })
          });
          const data = await res.json();
          if (res.ok) {
              toast.success(`${type} Repayment Successful!`);
              await fetchLoans();
          } else {
              toast.error(data.message || "Failed to process repayment.");
          }
      } catch (error) {
          console.error("Repayment error", error);
          toast.error("Network error during repayment.");
      } finally {
          setIsProcessing(null);
      }
  };

  const handleSimulateBilling = async (loanId: string) => {
    setIsProcessing(loanId);
    try {
        const res = await apiFetch("/api/loans/payments", {
            method: "POST",
            body: JSON.stringify({ loanId })
        });
        const data = await res.json();
        if (res.ok) {
            toast.success("EMI Billed Successfully! You can now pay it.");
            await fetchPayments(loanId);
            await fetchLoans();
        } else {
            toast.error(data.message || "Billing simulation failed.");
        }
    } catch (error) {
        console.error("Billing error", error);
    } finally {
        setIsProcessing(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Loans</h1>
          <p className="text-sm text-gray-500">Track active loans, upcoming EMI payments, and calculate new loans.</p>
        </div>
        <Button variant="primary" onClick={() => document.getElementById('loan-tool')?.scrollIntoView({ behavior: 'smooth' })}>
            Apply for a Loan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Active Accounts</h2>
            {isLoading ? (
            <div className="py-10 flex justify-center bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            ) : loans.length === 0 ? (
            <div className="py-16 text-center bg-white border border-dashed border-gray-200 rounded-xl shadow-sm">
                <div className="mx-auto h-14 w-14 text-gray-300 mb-4 flex items-center justify-center rounded-full bg-gray-50">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">No active loans</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">Use the EMI Calculator on the right to find the best plan, then apply for your first loan.</p>
                <button
                    onClick={() => document.getElementById('loan-tool')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Calculate & Apply →
                </button>
            </div>
            ) : (
            <div className="grid grid-cols-1 gap-6">
                {loans.map((loan) => {
                const progress = loan.principalAmount > 0 
                  ? ((loan.principalAmount - loan.remainingAmount) / loan.principalAmount) * 100 
                  : 0;
                
                const isApproved = loan.currentStatus === 'Approved' || loan.currentStatus === 'Active';

                return (
                    <div key={loan._id} className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                        <div>
                        <h3 className="text-lg font-bold text-gray-900">{loan.loanType} Loan</h3>
                        <p className="text-sm font-mono text-gray-500">Ref: {loan.loanReference}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                        ${isApproved ? 'bg-green-50 text-green-700 border-green-200' : 
                            loan.currentStatus === 'Applied' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                            'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {loan.currentStatus}
                        </span>
                    </div>
                    
                    <div className="p-6 bg-gray-50 space-y-5">
                        <div className="flex justify-between items-end">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Remaining Balance</p>
                            <p className="text-2xl font-bold text-gray-900">
                            ₹{loan.remainingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Principal</p>
                            <p className="text-sm font-semibold text-gray-900">
                            ₹{loan.principalAmount.toLocaleString("en-IN")}
                            </p>
                        </div>
                        </div>

                        <div>
                        <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                            <span>{progress.toFixed(1)}% Paid Off</span>
                            <span>{loan.interestRate}% Interest Rate</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Next EMI Due</p>
                            <p className="text-sm font-bold text-red-600">
                            {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }) : 'Waiting for Approval'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">EMI Amount</p>
                            <p className="text-sm font-bold text-gray-900">
                            ₹{loan.emiAmount.toLocaleString("en-IN")}
                            </p>
                        </div>
                        </div>
                    </div>
                    
                    <div className="px-6 py-4 border-t border-gray-200 flex flex-col gap-3 bg-white">
                        {/* Online Repayment Logic */}
                        {isApproved && (
                          <div className="space-y-3">
                            {payments[loan._id]?.find(p => p.currentStatus === 'Pending') ? (
                              <div className="flex flex-col gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-red-700">CURRENT INSTALLMENT DUE</span>
                                  <span className="text-sm font-bold text-red-900 italic">₹{payments[loan._id]?.find(p => p.currentStatus === 'Pending')?.amountExpected.toLocaleString()}</span>
                                </div>
                                <Button 
                                  variant="primary" 
                                  className="w-full bg-red-600 hover:bg-red-700 h-9" 
                                  onClick={() => handleRepay(loan._id, payments[loan._id]?.find(p => p.currentStatus === 'Pending')?._id || "", 'EMI')}
                                  isLoading={isProcessing === loan._id}
                                >
                                  Pay Now
                                </Button>
                              </div>
                            ) : (
                              loan.currentStatus === 'Active' && (
                                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                  <span className="text-xs font-medium text-blue-700">Next billing on {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString('en-IN', {month: 'short', day: '2-digit'}) : '...'}</span>
                                  <Button 
                                    variant="ghost" 
                                    className="text-[10px] h-7 px-2 font-bold hover:bg-blue-100 text-blue-600"
                                    onClick={() => handleSimulateBilling(loan._id)}
                                    isLoading={isProcessing === loan._id}
                                  >
                                    Simulate Billing
                                  </Button>
                                </div>
                              )
                            )}

                            {loan.currentStatus === 'Active' && (
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-50 px-3 py-1.5 rounded border border-gray-100">
                                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                  <span>Automated EMI recovery is linked to your account ending in {loan.accountId?.slice(-4)}.</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                             {loan.currentStatus === 'Active' && (
                                <Button variant="outline" className="flex-1 text-xs border-red-200 hover:bg-red-50 text-red-600 h-9" onClick={() => handleRepay(loan._id, "", 'FORECLOSE')}>
                                    Foreclose
                                </Button>
                             )}
                            <Button 
                                variant="outline" 
                                className="flex-1 text-xs h-9"
                                onClick={() => setHistoryLoan(loan)}
                            >
                                Payment History
                            </Button>
                            <Button 
                                variant="outline" 
                                className="flex-1 text-xs h-9"
                                onClick={() => setScheduleLoan(loan)}
                            >
                                Schedule
                            </Button>
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>
            )}
        </div>

        <div className="lg:col-span-1 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Tools</h2>
            <EmiCalculator onApplySuccess={fetchLoans} /> 
        </div>
      </div>

      {scheduleLoan && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Repayment Schedule</h3>
                        <p className="text-sm text-gray-500">Ref: {scheduleLoan.loanReference} • ₹{scheduleLoan.principalAmount.toLocaleString("en-IN")} @ {scheduleLoan.interestRate}%</p>
                    </div>
                    <button 
                        onClick={() => setScheduleLoan(null)}
                        className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-0">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="bg-white sticky top-0 shadow-sm border-b border-gray-200 z-10">
                            <tr>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">#</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">EMI (₹)</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Principal (₹)</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Interest (₹)</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Balance (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {generateSchedule(scheduleLoan).map((row) => (
                                <tr key={row.month} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-6 text-gray-500 text-sm">{row.month}</td>
                                    <td className="py-3 px-6 font-medium text-gray-900">{row.date}</td>
                                    <td className="py-3 px-6 text-gray-600 font-mono">{Math.round(row.emi).toLocaleString("en-IN")}</td>
                                    <td className="py-3 px-6 text-green-600 font-mono">{Math.round(row.principal).toLocaleString("en-IN")}</td>
                                    <td className="py-3 px-6 text-red-500 font-mono">{Math.round(row.interest).toLocaleString("en-IN")}</td>
                                    <td className="py-3 px-6 font-bold text-gray-900 font-mono">{Math.round(row.balance).toLocaleString("en-IN")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {historyLoan && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Actual Repayment History</h3>
                        <p className="text-sm text-gray-500">View real transactional records for {historyLoan.loanReference}</p>
                    </div>
                    <button 
                        onClick={() => setHistoryLoan(null)}
                        className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-0">
                    {!payments[historyLoan._id] || payments[historyLoan._id].filter(p => p.currentStatus !== 'Pending').length === 0 ? (
                        <div className="py-20 text-center text-gray-500">No repayment history found.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white sticky top-0 shadow-sm border-b border-gray-200 z-10">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500">Reference</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500">Paid Date</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500">Amount Paid</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500">Principal</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500">Interest</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payments[historyLoan._id].filter(p => p.currentStatus !== 'Pending').map((p) => (
                                    <tr key={p._id} className="hover:bg-gray-50">
                                        <td className="py-4 px-6 text-sm font-mono">{p.paymentReference}</td>
                                        <td className="py-4 px-6 text-sm">
                                          {p.paidDate ? new Date(p.paidDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-900">₹{p.amountPaid.toLocaleString()}</td>
                                        <td className="py-4 px-6 text-sm text-green-600">₹{p.principalComponent.toLocaleString()}</td>
                                        <td className="py-4 px-6 text-sm text-red-500">₹{p.interestComponent.toLocaleString()}</td>
                                        <td className="py-4 px-6">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.currentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.currentStatus}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}