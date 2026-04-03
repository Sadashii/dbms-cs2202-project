import { getMyTransactions } from "@/app/actions/customer";
import Link from "next/link";

interface SearchParams {
  page?: string;
  type?: string;
  from?: string;
  to?: string;
  amount?: string;
}

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "💰 Deposit",
  WITHDRAWAL: "💸 Withdrawal",
  TRANSFER: "🔄 Transfer",
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  FAILED: "bg-red-100 text-red-700",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const filters = {
    type: params.type,
    from: params.from,
    to: params.to,
    amount: params.amount,
  };

  const { transactions, total } = await getMyTransactions(page, filters);
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Transaction History</h1>

      {/* Filter form */}
      <form method="GET" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select
              name="type"
              defaultValue={filters.type ?? ""}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              name="from"
              defaultValue={filters.from ?? ""}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              name="to"
              defaultValue={filters.to ?? ""}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
            <input
              type="number"
              name="amount"
              defaultValue={filters.amount ?? ""}
              min="0"
              step="0.01"
              placeholder="Exact amount"
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Filter
          </button>
          <Link
            href="/dashboard/transactions"
            className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md text-sm hover:bg-gray-200 transition-colors"
          >
            Reset
          </Link>
        </div>
      </form>

      {/* Table */}
      {transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No transactions found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">From</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">To</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{tx.transactionId}</td>
                    <td className="px-4 py-3">{TYPE_LABELS[tx.type] ?? tx.type}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {tx.sender ? `${tx.sender.name} (${tx.sender.accountNumber})` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {tx.receiver ? `${tx.receiver.name} (${tx.receiver.accountNumber})` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[tx.status] ?? ""}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/dashboard/transactions?page=${page - 1}&type=${filters.type ?? ""}&from=${filters.from ?? ""}&to=${filters.to ?? ""}&amount=${filters.amount ?? ""}`}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/dashboard/transactions?page=${page + 1}&type=${filters.type ?? ""}&from=${filters.from ?? ""}&to=${filters.to ?? ""}&amount=${filters.amount ?? ""}`}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
