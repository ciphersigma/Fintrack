import { useState } from "react";
import { createTransaction } from "../api/transactions";
import { CATEGORIES, PAYMENT_METHODS } from "../utils/constants";
import toast from "react-hot-toast";
import { HiPlus, HiX } from "react-icons/hi";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-base text-gray-800 placeholder:text-gray-400 transition-colors";

export default function QuickAdd({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [payment, setPayment] = useState("UPI");
  const [type, setType] = useState("Expense");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setAmount("");
    setCategory("Food");
    setPayment("UPI");
    setType("Expense");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || saving) return;
    setSaving(true);
    try {
      await createTransaction({
        date: new Date().toISOString().split("T")[0],
        category,
        subcategory: null,
        description: null,
        payment_method: payment,
        type,
        amount: parseFloat(amount),
        liability_name: null,
      });
      toast.success("Added");
      reset();
      setOpen(false);
      if (onAdded) onAdded();
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-300/40 flex items-center justify-center active:scale-95 transition-transform"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)" }}
        aria-label="Quick add"
      >
        <HiPlus className="w-6 h-6" />
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-6 pb-8 sm:mb-0" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 32px)" }}>
            {/* Handle bar on mobile */}
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5 sm:hidden" />

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Quick Add</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount — big input */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0"
                    autoFocus
                    className={`${inputClass} pl-8 text-xl font-bold`}
                  />
                </div>
              </div>

              {/* Type toggle */}
              <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
                {["Expense", "Income", "Transfer"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                      type === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.slice(0, 8).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        category === c ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                  <select
                    value={CATEGORIES.slice(0, 8).includes(category) ? "" : category}
                    onChange={(e) => { if (e.target.value) setCategory(e.target.value); }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 border-0"
                  >
                    <option value="">More</option>
                    {CATEGORIES.slice(8).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Payment</label>
                <div className="flex flex-wrap gap-1.5">
                  {PAYMENT_METHODS.slice(0, 4).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayment(m)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        payment === m ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                  {PAYMENT_METHODS.slice(4).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayment(m)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        payment === m ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving || !amount}
                className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200"
              >
                {saving ? "Adding..." : "Add Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
