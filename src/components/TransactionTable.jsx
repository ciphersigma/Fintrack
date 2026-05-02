import { formatCurrency, formatDate } from "../utils/format";
import { HiPencil, HiTrash } from "react-icons/hi";

const typeConfig = {
  Income: { bg: "bg-emerald-500", text: "text-emerald-600", sign: "+" },
  Expense: { bg: "bg-rose-500", text: "text-rose-600", sign: "−" },
  Transfer: { bg: "bg-blue-500", text: "text-blue-600", sign: "" },
};

export default function TransactionTable({ transactions, onEdit, onDelete }) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-300">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-sm font-medium">No transactions this month</p>
        <p className="text-xs mt-1">Tap "New" to add your first one</p>
      </div>
    );
  }

  // Group by date
  const grouped = {};
  transactions.forEach((tx) => {
    const key = tx.date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });

  return (
    <div className="divide-y divide-gray-50">
      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date}>
          {/* Date header */}
          <div className="px-4 sm:px-5 py-2 bg-gray-50/50">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {formatDate(date)}
            </span>
          </div>
          {/* Transactions for this date */}
          {txs.map((tx) => {
            const cfg = typeConfig[tx.type];
            return (
              <div key={tx.id} className="group flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-indigo-50/30 transition-colors">
                {/* Type dot */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.bg}`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-800 truncate">{tx.category}</span>
                    {tx.subcategory && <span className="text-[11px] text-gray-400 hidden sm:inline">/ {tx.subcategory}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {tx.payment_method && <span className="text-[11px] text-gray-400">{tx.payment_method}</span>}
                    {tx.description && <span className="text-[11px] text-gray-400 hidden sm:inline truncate max-w-[200px]">· {tx.description}</span>}
                  </div>
                </div>

                {/* Amount */}
                <span className={`text-sm font-bold tabular shrink-0 ${cfg.text}`}>
                  {cfg.sign}{formatCurrency(tx.amount)}
                </span>

                {/* Actions */}
                <div className="flex gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(tx)} className="p-2 sm:p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" aria-label="Edit">
                    <HiPencil className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button onClick={() => onDelete(tx.id)} className="p-2 sm:p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" aria-label="Delete">
                    <HiTrash className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
