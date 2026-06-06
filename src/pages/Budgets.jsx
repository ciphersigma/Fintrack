import { useEffect, useState, useCallback } from "react";
import { useFinance, usePageRefresh } from "../context/FinanceContext";
import { formatCurrency } from "../utils/format";
import { CATEGORIES } from "../utils/constants";
import * as budgetApi from "../api/budgets";
import EmptyState from "../components/EmptyState";
import toast from "react-hot-toast";
import { HiPlus, HiTrash, HiCheck, HiX, HiPencil } from "react-icons/hi";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-colors";

// Progress colour by how much of the budget is used.
function barColor(pct) {
  if (pct >= 100) return "bg-rose-500";
  if (pct >= 80) return "bg-amber-500";
  return "bg-emerald-500";
}
function textColor(pct) {
  if (pct >= 100) return "text-rose-600";
  if (pct >= 80) return "text-amber-600";
  return "text-emerald-600";
}

const monthName = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

export default function Budgets() {
  const { budgets, fetchBudgets } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");

  const load = useCallback(() => { fetchBudgets().catch(() => {}); }, [fetchBudgets]);
  useEffect(() => { load(); }, [load]);
  usePageRefresh(load);

  const list = budgets?.budgets ?? [];
  const usedCategories = list.map((b) => b.category);
  const availableCategories = CATEGORIES.filter((c) => !usedCategories.includes(c));

  const openForm = () => {
    setCategory(availableCategories[0] || "");
    setAmount("");
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false); setCategory(""); setAmount("");
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!category || !amount || saving) return;
    setSaving(true);
    try {
      await budgetApi.saveBudget(category, parseFloat(amount));
      toast.success(`Budget set for ${category}`);
      closeForm();
      load();
    } catch { toast.error("Failed to save budget"); }
    finally { setSaving(false); }
  };

  const handleSaveEdit = async (id) => {
    if (!editAmount || parseFloat(editAmount) <= 0) { toast.error("Enter a valid amount"); return; }
    try {
      await budgetApi.updateBudget(id, parseFloat(editAmount));
      toast.success("Budget updated");
      setEditingId(null); setEditAmount("");
      load();
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id, cat) => {
    if (!window.confirm(`Remove the budget for ${cat}?`)) return;
    try { await budgetApi.deleteBudget(id); toast.success("Budget removed"); load(); }
    catch { toast.error("Failed to delete"); }
  };

  const totalBudget = budgets?.totalBudget ?? 0;
  const totalSpent = budgets?.totalSpent ?? 0;
  const totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const overCount = list.filter((b) => b.pct >= 100).length;

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Budgets</h2>
          <p className="text-sm text-gray-400 mt-0.5">Monthly limits · {monthName}</p>
        </div>
        <button
          onClick={() => { if (showForm) closeForm(); else openForm(); }}
          disabled={!showForm && availableCategories.length === 0}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-40 ${
            showForm ? "bg-gray-100 text-gray-600 shadow-none" : "bg-indigo-600 text-white shadow-indigo-200"
          }`}
        >
          <HiPlus className={`w-4 h-4 transition-transform ${showForm ? "rotate-45" : ""}`} />
          {showForm ? "Close" : "New"}
        </button>
      </div>

      {/* Overall summary */}
      {list.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-4">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400">Spent this month</p>
              <p className="text-2xl font-extrabold tabular text-gray-900 mt-0.5">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">of {formatCurrency(totalBudget)}</p>
              <p className={`text-sm font-bold tabular ${textColor(totalPct)}`}>{totalPct}%</p>
            </div>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor(totalPct)}`} style={{ width: `${Math.min(100, totalPct)}%` }} />
          </div>
          {overCount > 0 && (
            <p className="text-xs text-rose-600 mt-3 flex items-center gap-1.5">
              ⚠️ {overCount} {overCount === 1 ? "category is" : "categories are"} over budget
            </p>
          )}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-4">Set a category budget</p>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 sm:items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                {availableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Monthly limit</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0.01" step="0.01" placeholder="0.00" className={inputClass} />
            </div>
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Save"}
            </button>
          </form>
        </div>
      )}

      {/* List */}
      {!budgets ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100">
          <EmptyState
            emoji="🎯"
            title="No budgets set yet"
            subtitle="Set a monthly limit per category to track your spending"
          />
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((b) => {
            const isEditing = editingId === b.id;
            const over = b.pct >= 100;
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-gray-800 truncate">{b.category}</span>
                    {over && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md shrink-0">OVER</span>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                      <>
                        <span className="text-sm text-gray-400 mr-1">₹</span>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          min="0.01"
                          step="0.01"
                          autoFocus
                          className="w-24 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm tabular"
                        />
                        <button onClick={() => handleSaveEdit(b.id)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors" aria-label="Save">
                          <HiCheck className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingId(null); setEditAmount(""); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors" aria-label="Cancel">
                          <HiX className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(b.id); setEditAmount(String(b.amount)); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          aria-label="Edit limit"
                        >
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.category)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          aria-label="Delete budget"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor(b.pct)}`} style={{ width: `${Math.min(100, b.pct)}%` }} />
                </div>

                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-gray-500 tabular">
                    <span className={`font-semibold ${textColor(b.pct)}`}>{formatCurrency(b.spent)}</span>
                    <span className="text-gray-400"> / {formatCurrency(b.amount)}</span>
                  </span>
                  <span className={`tabular font-medium ${b.remaining < 0 ? "text-rose-600" : "text-gray-400"}`}>
                    {b.remaining >= 0 ? `${formatCurrency(b.remaining)} left` : `${formatCurrency(Math.abs(b.remaining))} over`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
