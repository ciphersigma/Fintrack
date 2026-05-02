import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency } from "../utils/format";
import { CHART_COLORS } from "../utils/constants";
import { getSpendingComparison } from "../api/dashboard";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { HiArrowRight, HiTrendingUp, HiTrendingDown } from "react-icons/hi";

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 shadow-xl border border-gray-700">
      {formatCurrency(payload[0].value)}
    </div>
  );
};

export default function Dashboard() {
  const {
    summary, dailyExpenses, categoryExpenses,
    fetchSummary, fetchDailyExpenses, fetchCategoryExpenses,
  } = useFinance();

  useEffect(() => {
    fetchSummary();
    fetchDailyExpenses();
    fetchCategoryExpenses();
  }, [fetchSummary, fetchDailyExpenses, fetchCategoryExpenses]);

  // Spending comparison
  const [comparison, setComparison] = useState(null);
  useEffect(() => {
    getSpendingComparison().then(setComparison).catch(() => {});
  }, []);

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
          Loading your finances...
        </div>
      </div>
    );
  }

  const isNeg = summary.netWorth < 0;
  const areaData = dailyExpenses.map((d) => ({ day: new Date(d.date).getDate(), amt: parseFloat(d.total) }));
  const pieData = categoryExpenses.slice(0, 6).map((c) => ({ name: c.category, value: parseFloat(c.total) }));
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-1">Here's your financial overview</p>
      </div>

      {/* Net Worth Hero */}
      <div className={`relative rounded-2xl overflow-hidden px-6 py-7 sm:px-8 sm:py-9 ${
        isNeg ? "bg-gradient-to-br from-rose-600 via-red-600 to-orange-600" : "bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700"
      }`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/20" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/10" />
        </div>
        <div className="relative">
          <p className="text-white/60 text-xs font-semibold tracking-widest uppercase">Net Worth</p>
          <p className="text-white text-2xl sm:text-4xl font-extrabold mt-2 tabular tracking-tight break-all">
            {formatCurrency(summary.netWorth)}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-x-6 gap-y-1 mt-4 sm:mt-5">
            {[
              { label: "Income", value: summary.totalIncome, icon: HiTrendingUp },
              { label: "Expense", value: summary.totalExpense, icon: HiTrendingDown },
              { label: "Balance", value: summary.netBalance },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs sm:text-sm">
                <span className="text-white/50">{item.label}</span>
                <span className="text-white font-semibold tabular">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Today", value: summary.todayExpense, color: "text-gray-900" },
          { label: "This Month", value: summary.monthlyExpense, color: "text-gray-900" },
          { label: "You Owe", value: summary.totalDebt, color: "text-rose-600" },
          { label: "Owed to You", value: summary.totalReceivable, color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 px-3 sm:px-4 py-3 sm:py-3.5 card-hover">
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 uppercase tracking-wide">{s.label}</p>
            <p className={`text-base sm:text-lg font-bold tabular mt-0.5 sm:mt-1 ${s.color}`}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Spending Insight */}
      {comparison && comparison.lastMonthSamePeriod > 0 && (
        (() => {
          const diff = comparison.thisMonth - comparison.lastMonthSamePeriod;
          const pct = Math.round(Math.abs(diff) / comparison.lastMonthSamePeriod * 100);
          const isMore = diff > 0;
          const isLess = diff < 0;
          return (
            <div className={`rounded-2xl px-4 py-3 text-xs sm:text-sm ${
              isMore ? "bg-rose-50 border border-rose-100" : isLess ? "bg-emerald-50 border border-emerald-100" : "bg-gray-50 border border-gray-100"
            }`}>
              <span className="text-gray-600">
                {isMore && <>{" "}📈 Spent <span className="font-bold text-rose-600">{formatCurrency(Math.abs(diff))} more</span> than last month <span className="text-gray-400">({pct}%↑)</span></>}
                {isLess && <>{" "}📉 Spent <span className="font-bold text-emerald-600">{formatCurrency(Math.abs(diff))} less</span> than last month <span className="text-gray-400">({pct}%↓)</span></>}
                {!isMore && !isLess && <>Same spending as last month so far</>}
              </span>
            </div>
          );
        })()
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Spending Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Daily Spending</h3>
            <Link to="/charts" className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <HiArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {areaData.length > 1 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} interval="preserveStartEnd" />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Area type="monotone" dataKey="amt" stroke="#6366f1" strokeWidth={2.5} fill="url(#dashGrad)" dot={false} activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[160px] flex flex-col items-center justify-center text-gray-300">
              <span className="text-3xl mb-2">📉</span>
              <span className="text-sm">No spending data this month</span>
            </div>
          )}
        </div>

        {/* Category Pie */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Spending by Category</h3>
          {pieData.length > 0 ? (
            <>
              <div className="flex justify-center">
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2.5">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-xs text-gray-600 truncate">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 tabular">{Math.round((d.value / pieTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-gray-300">
              <span className="text-3xl mb-2">🍩</span>
              <span className="text-sm">No categories yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Debts Quick View */}
      {(summary.totalDebt > 0 || summary.totalReceivable > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Debts & Receivables</h3>
            <Link to="/debts" className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1">
              Manage <HiArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>You owe</span>
                <span>Owed to you</span>
              </div>
              <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
                {(() => {
                  const total = summary.totalDebt + summary.totalReceivable;
                  if (total === 0) return null;
                  return (
                    <>
                      <div className="bg-gradient-to-r from-rose-400 to-rose-500 transition-all rounded-l-full" style={{ width: `${(summary.totalDebt / total) * 100}%` }} />
                      <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all rounded-r-full" style={{ width: `${(summary.totalReceivable / total) * 100}%` }} />
                    </>
                  );
                })()}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm font-bold text-rose-600 tabular">{formatCurrency(summary.totalDebt)}</span>
                <span className="text-sm font-bold text-emerald-600 tabular">{formatCurrency(summary.totalReceivable)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
