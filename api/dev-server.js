require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const transactions = require("./transactions");
const dashboard = require("./dashboard");
const debts = require("./debts");
const budgets = require("./budgets");
const health = require("./health");

app.all("/api/transactions", transactions);
app.all("/api/dashboard", dashboard);
app.all("/api/debts", debts);
app.all("/api/budgets", budgets);
app.get("/api/health", health);

const me = require("./me");
app.get("/api/me", me);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`API dev server running on http://localhost:${PORT}`);
});
