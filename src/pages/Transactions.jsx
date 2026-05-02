import { useEffect, useState, useCallback } from "react";
import { useFinance } from "../context/FinanceContext";
import TransactionForm from "../components/TransactionForm";
import TransactionTable from "../components/TransactionTable";
import * as txApi from "../api/transactions";
import toast from "react-hot-toast";
import { HiPlus, HiChevronLeft, HiChevronRight } from "react-icons/hi";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getMonthRange(year, month) {
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

export default function Transactions() {
  const { transactions, totalTx, loading, fetchTransactions } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Month state — default to current month
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const goToPrevMonth = () => {
    setPage(1);
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const goToNextMonth = () => {
    setPage(1);
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const goToCurrentMonth = () => {
    setPage(1);
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  const { startDate, endDate } = getMonthRange(year, month);

  const load = useCallback(() => {
    fetchTransactions({ page, limit, startDate, endDate });
  }, [fetchTransactions, page, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    try {
      await txApi.createTransaction(data);
      toast.success("Transaction added");
      setShowForm(false);
      load();
    } catch { toast.error("Failed to add transaction"); }
  };

  const handleUpdate = async (data) => {
    try {
      await txApi.updateTransaction(editing.id, data);
      toast.success("Transaction updated");
      setEditing(null);
      load();
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await txApi.deleteTransaction(id);
      toast.success("Deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  const totalPages = Math.ceil(totalTx / limit);
  const isFormOpen = showForm || editing;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm((v) => !v); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all shadow-sm ${
            isFormOpen
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-none"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
          }`}
        >
          <HiPlus className={`w-4 h-4 transition-transform ${isFormOpen ? "rotate-45" : ""}`} />
          {isFormOpen ? "Close" : "New"}
        </button>
      </div>

      {/* Month picker */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={goToPrevMonth}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Previous month"
        >
          <HiChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">
            {MONTH_NAMES[month]} {year}
          </span>
          {!isCurrentMonth && (
            <button
              onClick={goToCurrentMonth}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Next month"
        >
          <HiChevronRight className="w-5 h-5" />
        </button>

        <span className="text-xs text-gray-400 ml-auto">
          {totalTx} {totalTx === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-4">
            {editing ? "Edit transaction" : "Add a new transaction"}
          </p>
          <TransactionForm
            initial={editing || undefined}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm animate-pulse">Loading...</div>
        ) : (
          <TransactionTable
            transactions={transactions}
            onEdit={(tx) => { setShowForm(false); setEditing(tx); }}
            onDelete={handleDelete}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {page} / {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
