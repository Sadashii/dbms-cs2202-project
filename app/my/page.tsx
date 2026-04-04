"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AccountSummary {
  _id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
}

export default function DashboardOverview() {
  const { user, apiFetch, requireAuth } = useAuthContext();
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Secure this route
  requireAuth("/auth/login");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Uses the interceptor to automatically handle token rotation
        const res = await apiFetch("/api/accounts");
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.accounts);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, apiFetch]);

  // Calculate total balance across all accounts
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  if (!user) return null; // Prevent flash of content while redirecting

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.firstName}
          </h1>
          <p className="text-sm text-gray-500">
            Here is your financial overview for today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/my/accounts">
            <Button variant="primary">Make a Transfer</Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Balance Card */}
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Balance</dt>
                  <dd>
                    <div className="text-2xl font-bold text-gray-900">
                      {isLoading ? (
                        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
                      ) : (
                        `₹${totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
            <div className="text-sm">
              <Link href="/my/accounts" className="font-medium text-blue-600 hover:text-blue-500">
                View all accounts
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Account List */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Active Accounts</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No active accounts found.</div>
          ) : (
            accounts.map((account) => (
              <div key={account._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{account.accountType} Account</p>
                  <p className="text-sm text-gray-500">****{account.accountNumber.slice(-4)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {account.currency} {account.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}