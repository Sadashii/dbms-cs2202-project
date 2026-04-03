import { getCustomers } from "@/app/actions/admin";
import Link from "next/link";

export default async function AdminPage() {
  const { customers, total } = await getCustomers(1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Total Customers</p>
          <p className="text-4xl font-bold text-blue-700">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center">
          <Link
            href="/admin/customers"
            className="text-blue-600 hover:underline font-medium text-sm"
          >
            👥 Manage Customers →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center">
          <Link
            href="/admin/ledger"
            className="text-blue-600 hover:underline font-medium text-sm"
          >
            📒 Ledger Actions →
          </Link>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Customers</h2>
      {customers.length === 0 ? (
        <p className="text-gray-500 text-sm">No customers yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Account #</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Balance</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">{c.accountNumber}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${c.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
