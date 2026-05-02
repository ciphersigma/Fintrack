import { useState, useEffect } from "react";
import { TRANSACTION_TYPES, CATEGORIES, PAYMENT_METHODS } from "../utils/constants";
import { toInputDate } from "../utils/format";

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  category: "",
  subcategory: "",
  description: "",
  payment_method: "",
  type: "Expense",
  amount: "",
  liability_name: "",
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-colors";

export default function TransactionForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (initial) {
      setForm({
        date: toInputDate(initial.date),
        category: initial.category || "",
        subcategory: initial.subcategory || "",
        description: initial.description || "",
        payment_method: initial.payment_method || "",
        type: initial.type || "Expense",
        amount: initial.amount ?? "",
        liability_name: initial.liability_name || "",
      });
    }
  }, [initial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      amount: parseFloat(form.amount),
      subcategory: form.subcategory || null,
      description: form.description || null,
      liability_name: form.liability_name || null,
    });
  };

  const showLiability = form.type === "Transfer" || form.type === "Expense";

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="date" className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
          <input id="date" type="date" name="date" value={form.date} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="type" className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
          <select id="type" name="type" value={form.type} onChange={handleChange} required className={inputClass}>
            {TRANSACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="amount" className="block text-xs font-medium text-gray-500 mb-1.5">Amount</label>
          <input id="amount" type="number" name="amount" value={form.amount} onChange={handleChange} required min="0" step="0.01" placeholder="0.00" className={inputClass} />
        </div>
        <div>
          <label htmlFor="category" className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
          <select id="category" name="category" value={form.category} onChange={handleChange} required className={inputClass}>
            <option value="">Select</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="subcategory" className="block text-xs font-medium text-gray-500 mb-1.5">Subcategory</label>
          <input id="subcategory" type="text" name="subcategory" value={form.subcategory} onChange={handleChange} placeholder="Optional" className={inputClass} />
        </div>
        <div>
          <label htmlFor="payment_method" className="block text-xs font-medium text-gray-500 mb-1.5">Payment Method</label>
          <select id="payment_method" name="payment_method" value={form.payment_method} onChange={handleChange} required className={inputClass}>
            <option value="">Select</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        {showLiability && (
          <div>
            <label htmlFor="liability_name" className="block text-xs font-medium text-gray-500 mb-1.5">Liability Name</label>
            <input id="liability_name" type="text" name="liability_name" value={form.liability_name} onChange={handleChange} placeholder="Optional" className={inputClass} />
          </div>
        )}
        <div className={showLiability ? "lg:col-span-2" : "lg:col-span-3"}>
          <label htmlFor="description" className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
          <input id="description" type="text" name="description" value={form.description} onChange={handleChange} placeholder="Optional note" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end mt-5">
        {onCancel && (
          <button type="button" onClick={onCancel} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors text-center">
            Cancel
          </button>
        )}
        <button type="submit" className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
          {initial ? "Save Changes" : "Add Transaction"}
        </button>
      </div>
    </form>
  );
}
