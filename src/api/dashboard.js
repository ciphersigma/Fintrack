import api from "./axios";

export const getSummary = () =>
  api.get("/dashboard", { params: { action: "summary" } }).then((r) => r.data);

export const getCategoryExpenses = () =>
  api.get("/dashboard", { params: { action: "category-expenses" } }).then((r) => r.data);

export const getDailyExpenses = (month) =>
  api.get("/dashboard", { params: { action: "daily-expenses", month } }).then((r) => r.data);

export const getMonthlyExpenses = (year) =>
  api.get("/dashboard", { params: { action: "monthly-expenses", year } }).then((r) => r.data);

export const getSpendingComparison = () =>
  api.get("/dashboard", { params: { action: "spending-comparison" } }).then((r) => r.data);

export const getStreak = () =>
  api.get("/dashboard", { params: { action: "streak" } }).then((r) => r.data);
