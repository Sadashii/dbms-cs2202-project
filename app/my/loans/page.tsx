"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import EmiCalculator from "@/components/EmiCalculator";

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
}

export default function LoansPage() {
  const { user, apiFetch, requireAuth } = useAuthContext();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [scheduleLoan, setScheduleLoan] = useState<Loan | null>(null);

  requireAuth("/auth/login");

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/loans", {
        headers: {
            "x-user-id": (user as any)?._id || ""
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        const sanitizedLoans = (data.loans || []).map((loan: any) => ({
          ...loan,
          principalAmount: loan.principalAmount?.$numberDecimal ? Number(loan.principalAmount.$numberDecimal) : Number(loan.principalAmount || 0),
          remainingAmount: loan.remainingAmount?.$numberDecimal ? Number(loan.remainingAmount.$numberDecimal) : Number(loan.remainingAmount || 0),
          emiAmount: loan.emiAmount?.$numberDecimal ? Number(loan.emiAmount.$numberDecimal) : Number(loan.emiAmount || 0),
          interestRate: loan.interestRate?.$numberDecimal ? Number(loan.interestRate.$numberDecimal) : Number(loan.interestRate || 0),
          tenureMonths: loan.tenureMonths || 12, 
        }));
        setLoans(sanitizedLoans);
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
            <div className="py-16 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4 flex items-center justify-center rounded-full bg-gray-50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900">No active loans</h3>
                <p className="mt-1 text-sm text-gray-500">You currently do not have any active loans with us.</p>
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
                        {/* Information Banner for Active Loans */}
                        {isApproved && (
                            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-md border border-blue-100">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                <span>EMI payments can be made in-person at your nearest branch.</span>
                            </div>
                        )}
                        
                        <div className="flex gap-3">
                            {/* Keep Pending Button for structural balance when not approved */}
                            {!isApproved && (
                                <Button variant="primary" className="flex-1" disabled>
                                    Pending Approval
                                </Button>
                            )}
                            <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => setScheduleLoan(loan)}
                            >
                                View Full Schedule
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
    </div>
  );
}