import { useEffect, useState, useCallback } from "react";
import { useFinance } from "../context/FinanceContext";
import TransactionForm from "../components/TransactionForm";
import TransactionTable from "../components/TransactionTable";
import * as txApi from "../api/transactions";
import { formatCurrency, exportTransactionsCsv } from "../utils/format";
import toast from "react-hot-toast";
import {
  HiPlus, HiChevronLeft, HiChevronRight, HiSearch, HiX,
  HiDownload, HiArrowUp, HiArrowDown,
} from "react-icons/hi";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TYPE_FILTERS = [
  { key: "", label: "All" },
  { key: "Income", label: "Income" },
  { key: "Expense", label: "Expense" },
  { key: "Transfer", label: "Transfer" },
];

function getMonthRange(year, month) {
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

export default function Transactions() {
  const { transactions, totalTx, txSummary, loading, fetchTransactions } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  // Month state — default to current month
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  // Debounce the search box so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleSearchChange = (v) => { setSearch(v); setPage(1); };
  const handleTypeFilter = (key) => { setTypeFilter(key); setPage(1); };

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
    fetchTransactions({ page, limit, startDate, endDate, type: typeFilter || undefined, search: debouncedSearch || undefined });
  }, [fetchTransactions, page, startDate, endDate, typeFilter, debouncedSearch]);

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

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await txApi.getTransactions({ page: 1, limit: 10000, startDate, endDate, type: typeFilter || undefined, search: debouncedSearch || undefined });
      if (!data.transactions.length) { toast.error("Nothing to export"); return; }
      exportTransactionsCsv(data.transactions, `fintrack-${year}-${String(month + 1).padStart(2, "0")}.csv`);
      toast.success(`Exported ${data.transactions.length} transactions`);
    } catch { toast.error("Export failed"); }
    finally { setExporting(false); }
  };

  const totalPages = Math.ceil(totalTx / limit);
  const isFormOpen = showForm || editing;
  const net = txSummary ? txSummary.income - txSummary.expense : 0;

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || totalTx === 0}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-xl text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            title="Export this month to CSV"
          >
            <HiDownload className="w-4 h-4" />
            {exporting ? "Exporting…" : "Export"}
          </button>
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
      </div>

      {/* Month picker */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Previous month"
        >
          <HiChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800 min-w-[110px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Next month"
        >
          <HiChevronRight className="w-5 h-5" />
        </button>

        {!isCurrentMonth && (
          <button
            onClick={goToCurrentMonth}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Today
          </button>
        )}

        <span className="text-xs text-gray-400 ml-auto">
          {totalTx} {totalTx === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Month summary bar */}
      {txSummary && (txSummary.income > 0 || txSummary.expense > 0) && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div className="bg-white rounded-2xl border border-gray-100 px-3 sm:px-4 py-3">
            <div className="flex items-center gap-1.5 text-emerald-600 mb-0.5">
              <HiArrowDown className="w-3.5 h-3.5" />
              <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 uppercase tracking-wide">Income</span>
            </div>
            <p className="text-sm sm:text-base font-bold tabular text-emerald-600">{formatCurrency(txSummary.income)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 px-3 sm:px-4 py-3">
            <div className="flex items-center gap-1.5 text-rose-600 mb-0.5">
              <HiArrowUp className="w-3.5 h-3.5" />
              <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 uppercase tracking-wide">Expense</span>
            </div>
            <p className="text-sm sm:text-base font-bold tabular text-rose-600">{formatCurrency(txSummary.expense)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 px-3 sm:px-4 py-3">
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5 mt-px">Net</p>
            <p className={`text-sm sm:text-base font-bold tabular ${net >= 0 ? "text-gray-900" : "text-rose-600"}`}>
              {net >= 0 ? "+" : "−"}{formatCurrency(Math.abs(net))}
            </p>
          </div>
        </div>
      )}

      {/* Search + type filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="relative flex-1">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search category, note, payment…"
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 py-2.5 text-sm text-gray-800 placeholder:text-gray-400"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded"
              aria-label="Clear search"
            >
              <HiX className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTypeFilter(t.key)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                typeFilter === t.key ? "bg-gray-900 text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
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
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="skeleton w-2 h-2 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-2.5 w-1/4" />
                </div>
                <div className="skeleton h-3.5 w-16" />
              </div>
            ))}
          </div>
        ) : (debouncedSearch || typeFilter) && transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-sm font-medium">No matching transactions</p>
            <button
              onClick={() => { handleSearchChange(""); handleTypeFilter(""); }}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <TransactionTable
            transactions={transactions}
            onEdit={(tx) => { setShowForm(false); setEditing(tx); }}
            onDelete={handleDelete}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
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
