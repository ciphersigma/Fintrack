import api from "./axios";

export const getDebts = (params = {}) =>
  api.get("/debts", { params }).then((r) => r.data);

export const getDebtSummary = () =>
  api.get("/debts", { params: { action: "summary" } }).then((r) => r.data);

export const createDebt = (data) =>
  api.post("/debts", data).then((r) => r.data);

export const updateDebt = (id, data) =>
  api.put("/debts", data, { params: { id } }).then((r) => r.data);

export const toggleSettle = (id) =>
  api.patch("/debts", {}, { params: { id, action: "settle" } }).then((r) => r.data);

export const deleteDebt = (id) =>
  api.delete("/debts", { params: { id } }).then((r) => r.data);

// Payments (EMI)
export const getPayments = (debtId) =>
  api.get("/debts", { params: { id: debtId, action: "payments" } }).then((r) => r.data);

export const addPayment = (debtId, data) =>
  api.post("/debts", data, { params: { id: debtId, action: "payments" } }).then((r) => r.data);

export const deletePayment = (debtId, paymentId) =>
  api.delete("/debts", { params: { id: debtId, paymentId } }).then((r) => r.data);
