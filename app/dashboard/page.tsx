import { getMyProfile } from "@/app/actions/customer";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Current Balance</p>
          <p className="text-4xl font-bold text-blue-700">
            ${profile.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Account details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Account Details</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-800">{profile.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-800">{profile.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Account Number</span>
            <span className="font-mono font-medium text-gray-800">{profile.accountNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Role</span>
            <span className="font-medium text-gray-800">{profile.role}</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/transactions"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            📋 View Transactions
          </Link>
          <Link
            href="/dashboard/transfer"
            className="inline-flex items-center gap-2 bg-blue-600 rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors"
          >
            💸 Transfer Funds
          </Link>
        </div>
      </div>
    </div>
  );
}
