import { useEffect } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency } from "../utils/format";
import { CHART_COLORS } from "../utils/constants";
import useIsMobile from "../hooks/useIsMobile";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-gray-700">
      {label && <p className="text-gray-400 mb-0.5">{label}</p>}
      <p className="font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

const EmptyChart = ({ emoji, text }) => (
  <div className="h-56 flex flex-col items-center justify-center text-gray-300">
    <span className="text-3xl mb-2">{emoji}</span>
    <span className="text-sm">{text}</span>
  </div>
);

export default function Charts() {
  const {
    categoryExpenses, dailyExpenses, monthlyExpenses,
    fetchCategoryExpenses, fetchDailyExpenses, fetchMonthlyExpenses,
  } = useFinance();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchCategoryExpenses();
    fetchDailyExpenses();
    fetchMonthlyExpenses();
  }, [fetchCategoryExpenses, fetchDailyExpenses, fetchMonthlyExpenses]);

  const pieData = categoryExpenses.map((c) => ({ name: c.category, value: parseFloat(c.total) }));
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);
  const lineData = dailyExpenses.map((d) => ({ day: new Date(d.date).getDate(), amount: parseFloat(d.total) }));
  const barData = monthlyExpenses.map((m) => ({ month: new Date(m.month + "-01").toLocaleDateString("en-IN", { month: "short" }), amount: parseFloat(m.total) }));

  return (
    <div className="animate-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics 📈</h1>
        <p className="text-sm text-gray-400 mt-1">Visual breakdown of your spending patterns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Daily Area */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-5">Daily Spending This Month</h3>
          {lineData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f3f4f6" strokeDasharray="4 4" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} width={40} hide={isMobile} />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} fill="url(#cGrad)" dot={false} activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart emoji="📉" text="Not enough daily data yet" />}
        </div>

        {/* Category Pie */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-5">By Category</h3>
          {pieData.length > 0 ? (
            <>
              <div className="flex justify-center">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-5 space-y-2.5">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-3 h-3 rounded shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-xs text-gray-600 truncate">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-gray-400 tabular">{Math.round((d.value / pieTotal) * 100)}%</span>
                      <span className="text-xs font-semibold text-gray-700 tabular">{formatCurrency(d.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyChart emoji="🍩" text="No category data yet" />}
        </div>

        {/* Monthly Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-5">Monthly Trend</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid stroke="#f3f4f6" strokeDasharray="4 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} width={40} hide={isMobile} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={isMobile ? 20 : 32}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={i === barData.length - 1 ? "#6366f1" : "#c7d2fe"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart emoji="📊" text="No monthly data yet" />}
        </div>
      </div>
    </div>
  );
}
