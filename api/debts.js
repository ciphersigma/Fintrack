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
  const paymentId = query.paymentId;
  const action = query.action;

  try {
    if (method === "GET" && action === "summary") {
      const r = await pool.query(`
        SELECT COALESCE(SUM(CASE WHEN d.type='debt' AND NOT d.settled THEN d.amount-COALESCE(p.tp,0) ELSE 0 END),0) AS total_debt,
               COALESCE(SUM(CASE WHEN d.type='receivable' AND NOT d.settled THEN d.amount-COALESCE(p.tp,0) ELSE 0 END),0) AS total_receivable
        FROM debts d LEFT JOIN (SELECT debt_id,SUM(amount) AS tp FROM debt_payments GROUP BY debt_id) p ON p.debt_id=d.id
        WHERE d.user_id=$1`, [uid]);
      return res.json(r.rows[0]);
    }

    if (method === "GET" && id && action === "payments") {
      // Verify debt belongs to user
      const check = await pool.query("SELECT id FROM debts WHERE id=$1 AND user_id=$2", [id, uid]);
      if (check.rows.length === 0) return res.status(404).json({ error: "Not found" });
      const r = await pool.query(`SELECT * FROM debt_payments WHERE debt_id=$1 ORDER BY date DESC, created_at DESC`, [id]);
      return res.json(r.rows);
    }

    if (method === "POST" && id && action === "payments") {
      const { amount, note, date } = body;
      if (amount == null || !date) return res.status(400).json({ error: "Missing amount or date" });
      const check = await pool.query("SELECT id FROM debts WHERE id=$1 AND user_id=$2", [id, uid]);
      if (check.rows.length === 0) return res.status(404).json({ error: "Debt not found" });
      const r = await pool.query(`INSERT INTO debt_payments (debt_id,amount,note,date) VALUES ($1,$2,$3,$4) RETURNING *`, [id, amount, note || null, date]);
      return res.status(201).json(r.rows[0]);
    }

    if (method === "DELETE" && id && paymentId) {
      const check = await pool.query("SELECT id FROM debts WHERE id=$1 AND user_id=$2", [id, uid]);
      if (check.rows.length === 0) return res.status(404).json({ error: "Not found" });
      const r = await pool.query("DELETE FROM debt_payments WHERE id=$1 AND debt_id=$2 RETURNING *", [paymentId, id]);
      if (r.rows.length === 0) return res.status(404).json({ error: "Payment not found" });
      return res.json({ message: "Deleted", payment: r.rows[0] });
    }

    if (method === "PATCH" && id && action === "settle") {
      const r = await pool.query(`UPDATE debts SET settled=NOT settled, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`, [id, uid]);
      if (r.rows.length === 0) return res.status(404).json({ error: "Not found" });
      return res.json(r.rows[0]);
    }

    if (method === "GET" && !id) {
      const { type, settled } = query;
      const conds = ["d.user_id=$1"];
      const params = [uid];
      let idx = 2;
      if (type) { conds.push(`d.type=$${idx++}`); params.push(type); }
      if (settled !== undefined) { conds.push(`d.settled=$${idx++}`); params.push(settled === "true"); }
      const where = `WHERE ${conds.join(" AND ")}`;
      const r = await pool.query(
        `SELECT d.*,COALESCE(p.tp,0) AS total_paid,d.amount-COALESCE(p.tp,0) AS remaining
         FROM debts d LEFT JOIN (SELECT debt_id,SUM(amount) AS tp FROM debt_payments GROUP BY debt_id) p ON p.debt_id=d.id
         ${where} ORDER BY d.settled ASC, d.date DESC`, params);
      return res.json(r.rows);
    }

    if (method === "POST" && !id) {
      const { person_name, type, amount, reason, date } = body;
      if (!person_name || !type || amount == null || !date) return res.status(400).json({ error: "Missing fields" });
      const r = await pool.query(
        `INSERT INTO debts (user_id,person_name,type,amount,reason,date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [uid, person_name, type, amount, reason || null, date]);
      return res.status(201).json(r.rows[0]);
    }

    if (method === "PUT" && id) {
      const { person_name, type, amount, reason, date, settled } = body;
      if (!person_name || !type || amount == null || !date) return res.status(400).json({ error: "Missing fields" });
      const r = await pool.query(
        `UPDATE debts SET person_name=$1,type=$2,amount=$3,reason=$4,date=$5,settled=$6,updated_at=NOW() WHERE id=$7 AND user_id=$8 RETURNING *`,
        [person_name, type, amount, reason || null, date, settled || false, id, uid]);
      if (r.rows.length === 0) return res.status(404).json({ error: "Not found" });
      return res.json(r.rows[0]);
    }

    if (method === "DELETE" && id && !paymentId) {
      const r = await pool.query("DELETE FROM debts WHERE id=$1 AND user_id=$2 RETURNING *", [id, uid]);
      if (r.rows.length === 0) return res.status(404).json({ error: "Not found" });
      return res.json({ message: "Deleted", debt: r.rows[0] });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Debts error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
