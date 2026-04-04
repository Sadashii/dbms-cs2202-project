"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

interface Loan {
  _id: string;
  loanReference: string;
  loanType: string;
  principalAmount: number;
  remainingAmount: number;
  emiAmount: number;
  interestRate: number;
  currency: string;
  currentStatus: string;
  nextPaymentDate?: string;
}

export default function LoansPage() {
  const { apiFetch, requireAuth } = useAuthContext();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  requireAuth("/auth/login");

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const res = await apiFetch("/api/loans");
        if (res.ok) {
          const data = await res.json();
          setLoans(data.loans || []);
        }
      } catch (error) {
        console.error("Failed to fetch loans", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLoans();
  }, [apiFetch]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Loans</h1>
          <p className="text-sm text-gray-500">Track active loans and upcoming EMI payments.</p>
        </div>
        <Button variant="primary">Apply for a Loan</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isLoading ? (
          <div className="col-span-full py-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : loans.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-500 bg-white border border-gray-200 rounded-xl shadow-sm">
            You do not have any active loans.
          </div>
        ) : (
          loans.map((loan) => {
            const progress = ((loan.principalAmount - loan.remainingAmount) / loan.principalAmount) * 100;
            
            return (
              <div key={loan._id} className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{loan.loanType} Loan</h3>
                    <p className="text-sm font-mono text-gray-500">Ref: {loan.loanReference}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                    ${loan.currentStatus === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 
                      loan.currentStatus === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                      'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {loan.currentStatus}
                  </span>
                </div>
                
                <div className="p-6 bg-gray-50 space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Remaining Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loan.currency} {loan.remainingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Principal</p>
                      <p className="text-sm font-medium text-gray-900">
                        {loan.currency} {loan.principalAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Paid: {progress.toFixed(1)}%</span>
                      <span>{loan.interestRate}% Interest</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Next EMI Due</p>
                      <p className="text-sm font-medium text-red-600">
                        {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">EMI Amount</p>
                      <p className="text-sm font-bold text-gray-900">
                        {loan.currency} {loan.emiAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                  <Button variant="primary" className="flex-1">Pay EMI</Button>
                  <Button variant="outline" className="flex-1">View Schedule</Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}