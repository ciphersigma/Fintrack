const pool = require("./_db");
const { verifyAuth, setCors } = require("./_auth");

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const user = await verifyAuth(req, res);
  if (!user) return;
  const uid = user.userId;

  const { method, query, body } = req;
  const id = query.id;

  try {
    if (method === "GET") {
      // Current-month expense per category, joined with the user's budgets.
      const today = new Date().toISOString().split("T")[0];
      const monthStart = today.substring(0, 7) + "-01";

      const r = await pool.query(
        `SELECT b.id, b.category, b.amount,
                COALESCE(s.spent, 0) AS spent
         FROM budgets b
         LEFT JOIN (
           SELECT category, SUM(amount) AS spent
           FROM transactions
           WHERE user_id=$1 AND type='Expense' AND date>=$2 AND date<=$3
           GROUP BY category
         ) s ON s.category = b.category
         WHERE b.user_id=$1
         ORDER BY b.category ASC`,
        [uid, monthStart, today]
      );

      const budgets = r.rows.map((row) => {
        const amount = parseFloat(row.amount);
        const spent = parseFloat(row.spent);
        return {
          id: row.id,
          category: row.category,
          amount,
          spent,
          remaining: amount - spent,
          pct: amount > 0 ? Math.round((spent / amount) * 100) : 0,
        };
      });

      const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
      const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

      return res.json({ budgets, totalBudget, totalSpent });
    }

    if (method === "POST") {
      // Upsert: one budget per (user, category).
      const { category, amount } = body;
      if (!category || amount == null || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Valid category and amount required" });
      }
      const r = await pool.query(
        `INSERT INTO budgets (user_id, category, amount)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, category)
         DO UPDATE SET amount=EXCLUDED.amount, updated_at=NOW()
         RETURNING *`,
        [uid, category, parseFloat(amount)]
      );
      return res.status(201).json(r.rows[0]);
    }

    if (method === "PUT" && id) {
      const { amount } = body;
      if (amount == null || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Valid amount required" });
      }
      const r = await pool.query(
        `UPDATE budgets SET amount=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3 RETURNING *`,
        [parseFloat(amount), id, uid]
      );
      if (r.rows.length === 0) return res.status(404).json({ error: "Not found" });
      return res.json(r.rows[0]);
    }

    if (method === "DELETE" && id) {
      const r = await pool.query("DELETE FROM budgets WHERE id=$1 AND user_id=$2 RETURNING *", [id, uid]);
      if (r.rows.length === 0) return res.status(404).json({ error: "Not found" });
      return res.json({ message: "Deleted", budget: r.rows[0] });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Budgets error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
