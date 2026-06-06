import { createContext, useContext, useState, useCallback } from "react";
import * as txApi from "../api/transactions";
import * as dashApi from "../api/dashboard";
import * as liabApi from "../api/liabilities";
import * as debtApi from "../api/debts";
import * as budgetApi from "../api/budgets";

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [totalTx, setTotalTx] = useState(0);
  const [txSummary, setTxSummary] = useState(null);
  const [summary, setSummary] = useState(null);
  const [categoryExpenses, setCategoryExpenses] = useState([]);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [debts, setDebts] = useState([]);
  const [budgets, setBudgets] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async (params) => {
    setLoading(true);
    try {
      const data = await txApi.getTransactions(params);
      setTransactions(data.transactions);
      setTotalTx(data.total);
      setTxSummary(data.summary ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    const data = await dashApi.getSummary();
    setSummary(data);
  }, []);

  const fetchCategoryExpenses = useCallback(async () => {
    const data = await dashApi.getCategoryExpenses();
    setCategoryExpenses(data);
  }, []);

  const fetchDailyExpenses = useCallback(async (month) => {
    const data = await dashApi.getDailyExpenses(month);
    setDailyExpenses(data);
  }, []);

  const fetchMonthlyExpenses = useCallback(async (year) => {
    const data = await dashApi.getMonthlyExpenses(year);
    setMonthlyExpenses(data);
  }, []);

  const fetchLiabilities = useCallback(async () => {
    const data = await liabApi.getLiabilities();
    setLiabilities(data);
  }, []);

  const fetchDebts = useCallback(async (params) => {
    const data = await debtApi.getDebts(params);
    setDebts(data);
  }, []);

  const fetchBudgets = useCallback(async () => {
    const data = await budgetApi.getBudgets();
    setBudgets(data);
    return data;
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchSummary(),
      fetchCategoryExpenses(),
      fetchDailyExpenses(),
      fetchMonthlyExpenses(),
      fetchLiabilities(),
      fetchDebts(),
    ]);
  }, [fetchSummary, fetchCategoryExpenses, fetchDailyExpenses, fetchMonthlyExpenses, fetchLiabilities, fetchDebts]);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        totalTx,
        txSummary,
        summary,
        categoryExpenses,
        dailyExpenses,
        monthlyExpenses,
        liabilities,
        debts,
        budgets,
        loading,
        fetchTransactions,
        fetchSummary,
        fetchCategoryExpenses,
        fetchDailyExpenses,
        fetchMonthlyExpenses,
        fetchLiabilities,
        fetchDebts,
        fetchBudgets,
        refreshAll,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
};
