import api from "./axios";

export const getBudgets = () =>
  api.get("/budgets").then((r) => r.data);

// Upsert — one budget per category.
export const saveBudget = (category, amount) =>
  api.post("/budgets", { category, amount }).then((r) => r.data);

export const updateBudget = (id, amount) =>
  api.put("/budgets", { amount }, { params: { id } }).then((r) => r.data);

export const deleteBudget = (id) =>
  api.delete("/budgets", { params: { id } }).then((r) => r.data);
