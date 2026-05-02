import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency } from "../utils/format";
import { useEffect, useState } from "react";
import { HiOutlineLogout, HiOutlineCash, HiOutlineTrendingDown, HiOutlineScale, HiOutlineCalendar } from "react-icons/hi";

export default function Account() {
  const { user, logout } = useAuth();
  const { summary, debts, fetchSummary, fetchDebts } = useFinance();
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    fetchSummary();
    fetchDebts();
  }, [fetchSummary, fetchDebts]);

  if (!user) return null;

  const unsettledDebts = debts.filter((d) => !d.settled).length;
  const now = new Date();
  const monthName = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Profile */}
      <div className="flex flex-col items-center pt-4 mb-6">
        {user.picture ? (
          <img src={user.picture} alt="" className="w-20 h-20 rounded-full shadow-lg" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold shadow-lg">
            {user.name?.charAt(0) || "?"}
          </div>
        )}
        <h2 className="text-lg font-bold text-gray-900 mt-4">{user.name}</h2>
        <p className="text-xs text-gray-400 mt-0.5">Personal Account</p>
      </div>

      {/* Financial snapshot */}
      {summary && (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 mb-4">
          <div className="px-5 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <HiOutlineCash className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Net Worth</p>
              <p className={`text-sm font-bold tabular ${summary.netWorth >= 0 ? "text-gray-900" : "text-rose-600"}`}>
                {formatCurrency(summary.netWorth)}
              </p>
            </div>
          </div>
          <div className="px-5 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <HiOutlineTrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Spent in {monthName}</p>
              <p className="text-sm font-bold tabular text-gray-900">{formatCurrency(summary.monthlyExpense)}</p>
            </div>
          </div>
          <div className="px-5 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <HiOutlineScale className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Active Debts</p>
              <p className="text-sm font-bold text-gray-900">{unsettledDebts} pending</p>
            </div>
          </div>
          <div className="px-5 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <HiOutlineCalendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Today's Spending</p>
              <p className="text-sm font-bold tabular text-gray-900">{formatCurrency(summary.todayExpense)}</p>
            </div>
          </div>
        </div>
      )}

      {/* About */}
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">About Fintrack</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          A personal finance tracker to manage your income, expenses, debts, and EMIs. Your data is private and only accessible to you.
        </p>
        <p className="text-[10px] text-gray-300 mt-2">Version 1.0</p>
      </div>

      {/* Sign out */}
      {!confirmLogout ? (
        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-gray-500 bg-white rounded-2xl border border-gray-100 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-colors"
        >
          <HiOutlineLogout className="w-4 h-4" />
          Sign Out
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-rose-100 p-4">
          <p className="text-sm text-gray-700 text-center mb-3">Are you sure you want to sign out?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmLogout(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={logout}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}