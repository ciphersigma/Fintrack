const pool = require("./_db");
const { verifyAuth, setCors } = require("./_auth");

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req, res);
  if (!user) return;
  const uid = user.userId;

  const action = req.query.action;

  try {
    if (!action || action === "summary") {
      const today = new Date().toISOString().split("T")[0];
      const monthStart = today.substring(0, 7) + "-01";

      const todayExp = await pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id=$1 AND type='Expense' AND date=$2`, [uid, today]);
      const monthExp = await pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id=$1 AND type='Expense' AND date>=$2 AND date<=$3`, [uid, monthStart, today]);
      const totInc = await pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id=$1 AND type='Income'`, [uid]);
      const totExp = await pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id=$1 AND type='Expense'`, [uid]);
      const liab = await pool.query(`SELECT COALESCE(SUM(CASE WHEN type='Transfer' THEN amount ELSE 0 END)-SUM(CASE WHEN type='Expense' THEN amount ELSE 0 END),0) AS remaining FROM transactions WHERE user_id=$1 AND liability_name IS NOT NULL AND liability_name!=''`, [uid]);
      const debtS = await pool.query(`
        SELECT COALESCE(SUM(CASE WHEN d.type='debt' AND NOT d.settled THEN d.amount-COALESCE(p.tp,0) ELSE 0 END),0) AS total_debt,
               COALESCE(SUM(CASE WHEN d.type='receivable' AND NOT d.settled THEN d.amount-COALESCE(p.tp,0) ELSE 0 END),0) AS total_receivable
        FROM debts d LEFT JOIN (SELECT debt_id,SUM(amount) AS tp FROM debt_payments GROUP BY debt_id) p ON p.debt_id=d.id
        WHERE d.user_id=$1`, [uid]);

      const income = parseFloat(totInc.rows[0].total);
      const expense = parseFloat(totExp.rows[0].total);
      const remLiab = parseFloat(liab.rows[0].remaining);
      const tDebt = parseFloat(debtS.rows[0].total_debt);
      const tRec = parseFloat(debtS.rows[0].total_receivable);

      return res.json({
        todayExpense: parseFloat(todayExp.rows[0].total),
        monthlyExpense: parseFloat(monthExp.rows[0].total),
        totalIncome: income, totalExpense: expense,
        netBalance: income - expense, remainingLiabilities: remLiab,
        totalDebt: tDebt, totalReceivable: tRec,
        netWorth: income - expense - remLiab - tDebt + tRec,
      });
    }

    if (action === "spending-comparison") {
      const now = new Date();
      const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const dayOfMonth = now.getDate();

      // Last month same period (1st to same day)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthStart = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-01`;
      const lastMonthSameDay = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-${String(Math.min(dayOfMonth, new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate())).padStart(2, "0")}`;

      // Full last month total
      const lastMonthEnd = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-${String(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;

      const thisR = await pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id=$1 AND type='Expense' AND date>=$2 AND date<=$3`, [uid, thisMonthStart, now.toISOString().split("T")[0]]);
      const lastSameR = await pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id=$1 AND type='Expense' AND date>=$2 AND date<=$3`, [uid, lastMonthStart, lastMonthSameDay]);
      const lastFullR = await pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id=$1 AND type='Expense' AND date>=$2 AND date<=$3`, [uid, lastMonthStart, lastMonthEnd]);

      return res.json({
        thisMonth: parseFloat(thisR.rows[0].total),
        lastMonthSamePeriod: parseFloat(lastSameR.rows[0].total),
        lastMonthFull: parseFloat(lastFullR.rows[0].total),
        dayOfMonth,
      });
    }

    if (action === "streak") {
      // Get all distinct dates with transactions, ordered descending
      const r = await pool.query(
        `SELECT DISTINCT date FROM transactions WHERE user_id=$1 ORDER BY date DESC`,
        [uid]
      );
      const dates = r.rows.map((row) => row.date.toISOString().split("T")[0]);

      if (dates.length === 0) return res.json({ streak: 0, longestStreak: 0 });

      // Calculate current streak (consecutive days ending today or yesterday)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayStr = today.toISOString().split("T")[0];
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let streak = 0;
      // Start counting if the most recent entry is today or yesterday
      if (dates[0] === todayStr || dates[0] === yesterdayStr) {
        let checkDate = new Date(dates[0]);
        const dateSet = new Set(dates);
        while (dateSet.has(checkDate.toISOString().split("T")[0])) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      // Calculate longest streak ever
      let longest = 0;
      let current = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diffDays = (prev - curr) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          current++;
        } else {
          longest = Math.max(longest, current);
          current = 1;
        }
      }
      longest = Math.max(longest, current);

      return res.json({ streak, longestStreak: longest, totalDays: dates.length });
    }

    if (action === "category-expenses") {
      const r = await pool.query(`SELECT category,SUM(amount) AS total FROM transactions WHERE user_id=$1 AND type='Expense' GROUP BY category ORDER BY total DESC`, [uid]);
      return res.json(r.rows);
    }

    if (action === "daily-expenses") {
      const tm = req.query.month || new Date().toISOString().substring(0, 7);
      const sd = `${tm}-01`;
      const [y, m] = tm.split("-").map(Number);
      const ed = `${tm}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
      const r = await pool.query(`SELECT date,SUM(amount) AS total FROM transactions WHERE user_id=$1 AND type='Expense' AND date>=$2 AND date<=$3 GROUP BY date ORDER BY date`, [uid, sd, ed]);
      return res.json(r.rows);
    }

    if (action === "monthly-expenses") {
      const yr = req.query.year || new Date().getFullYear().toString();
      const r = await pool.query(`SELECT TO_CHAR(date,'YYYY-MM') AS month,SUM(amount) AS total FROM transactions WHERE user_id=$1 AND type='Expense' AND EXTRACT(YEAR FROM date)=$2 GROUP BY TO_CHAR(date,'YYYY-MM') ORDER BY month`, [uid, yr]);
      return res.json(r.rows);
    }

    res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
