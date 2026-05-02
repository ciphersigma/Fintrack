import { useEffect, useState, useCallback } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, formatDate, toInputDate } from "../utils/format";
import * as debtApi from "../api/debts";
import toast from "react-hot-toast";
import {
  HiPlus, HiPencil, HiTrash, HiCheck, HiRefresh,
  HiChevronDown, HiChevronUp,
} from "react-icons/hi";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-colors";

const emptyForm = {
  person_name: "", type: "debt", amount: "", reason: "",
  date: new Date().toISOString().split("T")[0],
};

// ─── Payment Section ───
function PaymentSection({ debt, onPaymentChange }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try { setPayments(await debtApi.getPayments(debt.id)); }
    finally { setLoading(false); }
  }, [debt.id]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const remaining = parseFloat(debt.amount) - parseFloat(debt.total_paid);
  const pct = parseFloat(debt.amount) > 0
    ? Math.min(100, (parseFloat(debt.total_paid) / parseFloat(debt.amount)) * 100)
    : 0;

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      await debtApi.addPayment(debt.id, { amount: parseFloat(amt), note: note || null, date });
      toast.success("Payment recorded");
      setAmt(""); setNote(""); setDate(new Date().toISOString().split("T")[0]);
      loadPayments(); onPaymentChange();
    } catch { toast.error("Failed"); }
  };

  const handleDeletePayment = async (pid) => {
    if (!window.confirm("Delete this payment?")) return;
    try {
      await debtApi.deletePayment(debt.id, pid);
      toast.success("Deleted"); loadPayments(); onPaymentChange();
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 space-y-4">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Paid {formatCurrency(debt.total_paid)}</span>
          <span>{formatCurrency(remaining)} left</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[11px] text-gray-400 mt-1">{Math.round(pct)}% of {formatCurrency(debt.amount)}</p>
      </div>

      {/* Quick pay */}
      {!debt.settled && remaining > 0 && (
        <form onSubmit={handlePay} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Amount</label>
            <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} required min="0.01" step="0.01" max={remaining} placeholder="0.00" className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Note</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. April EMI" className={inputClass} />
          </div>
          <button type="submit" className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200">
            Pay
          </button>
        </form>
      )}

      {/* History */}
      {loading ? (
        <p className="text-xs text-gray-400 animate-pulse">Loading...</p>
      ) : payments.length === 0 ? (
        <p className="text-xs text-gray-400">No payments recorded yet</p>
      ) : (
        <div className="space-y-1 max-h-44 overflow-y-auto">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2 bg-gray-50 text-sm">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-medium text-emerald-600 tabular">{formatCurrency(p.amount)}</span>
                <span className="text-gray-400 text-xs">{formatDate(p.date)}</span>
                {p.note && <span className="text-gray-400 text-xs hidden sm:inline truncate">— {p.note}</span>}
              </div>
              <button onClick={() => handleDeletePayment(p.id)} className="p-1 text-gray-300 hover:text-rose-500 transition-colors" aria-label="Delete">
                <HiTrash className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ───
export default function Debts() {
  const { debts, fetchDebts } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(() => {
    fetchDebts(filter !== "all" ? { type: filter } : {});
  }, [fetchDebts, filter]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setForm(emptyForm); setEditing(null); setShowForm(false); };
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, amount: parseFloat(form.amount), reason: form.reason || null };
    try {
      if (editing) {
        await debtApi.updateDebt(editing.id, { ...payload, settled: editing.settled });
        toast.success("Updated");
      } else {
        await debtApi.createDebt(payload);
        toast.success("Added");
      }
      resetForm(); load();
    } catch { toast.error("Failed"); }
  };

  const handleEdit = (item) => {
    setShowForm(true); setEditing(item);
    setForm({ person_name: item.person_name, type: item.type, amount: item.amount, reason: item.reason || "", date: toInputDate(item.date) });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry and all payments?")) return;
    try { await debtApi.deleteDebt(id); toast.success("Deleted"); if (expandedId === id) setExpandedId(null); load(); }
    catch { toast.error("Failed"); }
  };

  const handleSettle = async (id) => {
    try { await debtApi.toggleSettle(id); toast.success("Updated"); load(); }
    catch { toast.error("Failed"); }
  };

  const unsettledDebts = debts.filter((d) => d.type === "debt" && !d.settled);
  const unsettledRec = debts.filter((d) => d.type === "receivable" && !d.settled);
  const totalDebt = unsettledDebts.reduce((s, d) => s + parseFloat(d.remaining), 0);
  const totalRec = unsettledRec.reduce((s, d) => s + parseFloat(d.remaining), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Debts & Receivables</h2>
          <p className="text-sm text-gray-400 mt-0.5">Track what you owe and what others owe you</p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all shadow-sm ${
            showForm ? "bg-gray-100 text-gray-600 shadow-none" : "bg-indigo-600 text-white shadow-indigo-200"
          }`}
        >
          <HiPlus className={`w-4 h-4 transition-transform ${showForm ? "rotate-45" : ""}`} />
          {showForm ? "Close" : "New"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">You owe</p>
          <p className="text-lg font-semibold text-rose-600 tabular">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Others owe you</p>
          <p className="text-lg font-semibold text-emerald-600 tabular">{formatCurrency(totalRec)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Net</p>
          <p className={`text-lg font-semibold tabular ${totalRec - totalDebt >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(totalRec - totalDebt)}
          </p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-4">{editing ? "Edit entry" : "New entry"}</p>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Person</label>
                <input type="text" name="person_name" value={form.person_name} onChange={handleChange} required placeholder="Name" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                  <option value="debt">I owe them</option>
                  <option value="receivable">They owe me</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Amount</label>
                <input type="number" name="amount" value={form.amount} onChange={handleChange} required min="0" step="0.01" placeholder="0.00" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} required className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Reason</label>
                <input type="text" name="reason" value={form.reason} onChange={handleChange} placeholder="Optional" className={inputClass} />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end mt-5">
              <button type="button" onClick={resetForm} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-center">Cancel</button>
              <button type="submit" className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors">
                {editing ? "Save" : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1.5 mb-4">
        {[{ key: "all", label: "All" }, { key: "debt", label: "Debts" }, { key: "receivable", label: "Receivables" }].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === t.key ? "bg-gray-900 text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {debts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400 text-sm">
          No entries yet
        </div>
      ) : (
        <div className="space-y-2">
          {debts.map((d) => {
            const isOpen = expandedId === d.id;
            const remaining = parseFloat(d.remaining);
            const pct = parseFloat(d.amount) > 0 ? Math.round((parseFloat(d.total_paid) / parseFloat(d.amount)) * 100) : 0;

            return (
              <div key={d.id} className={`bg-white rounded-2xl border border-gray-100 overflow-hidden transition-opacity ${d.settled ? "opacity-50" : ""}`}>
                <div
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedId(isOpen ? null : d.id)}
                >
                  <button className="text-gray-300 shrink-0 hidden sm:block" aria-label="Expand">
                    {isOpen ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Avatar */}
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold shrink-0 ${
                    d.type === "debt" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {d.person_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800 truncate">{d.person_name}</span>
                      <span className={`text-[11px] font-medium ${d.type === "debt" ? "text-rose-500" : "text-emerald-500"}`}>
                        {d.type === "debt" ? "I owe" : "Owes me"}
                      </span>
                      {d.settled && <span className="text-[11px] text-gray-400">· Settled</span>}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-xs text-gray-400">
                      <span>{formatDate(d.date)}</span>
                      {d.reason && <span className="hidden sm:inline">· {d.reason}</span>}
                      <span>· {pct}% paid</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold tabular ${d.type === "debt" ? "text-rose-600" : "text-emerald-600"}`}>
                      {formatCurrency(remaining)}
                    </p>
                    <p className="text-[11px] text-gray-400 hidden sm:block">of {formatCurrency(d.amount)}</p>
                  </div>

                  <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleSettle(d.id)} className="p-2 sm:p-1.5 rounded-lg text-gray-400 sm:text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title={d.settled ? "Reopen" : "Settle"}>
                      {d.settled ? <HiRefresh className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <HiCheck className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
                    </button>
                    <button onClick={() => handleEdit(d)} className="p-2 sm:p-1.5 rounded-lg text-gray-400 sm:text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit">
                      <HiPencil className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="p-2 sm:p-1.5 rounded-lg text-gray-400 sm:text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
                      <HiTrash className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>

                {isOpen && <PaymentSection debt={d} onPaymentChange={load} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
