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
      if (id) {
        const r = await pool.query("SELECT * FROM transactions WHERE id=$1 AND user_id=$2", [id, uid]);
        if (r.rows.length === 0) return res.status(404).json({ error: "Not found" });
        return res.json(r.rows[0]);
      }

      const { type, category, startDate, endDate, page = 1, limit = 50 } = query;
      const conds = ["user_id=$1"];
      const params = [uid];
      let idx = 2;

      if (type) { conds.push(`type=$${idx++}`); params.push(type); }
      if (category) { conds.push(`category=$${idx++}`); params.push(category); }
      if (startDate) { conds.push(`date>=$${idx++}`); params.push(startDate); }
      if (endDate) { conds.push(`date<=$${idx++}`); params.push(endDate); }

      const where = `WHERE ${conds.join(" AND ")}`;
      const offset = (Number(page) - 1) * Number(limit);

      const countR = await pool.query(`SELECT COUNT(*) FROM transactions ${where}`, params);
      const r = await pool.query(
        `SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, Number(limit), offset]
      );
      return res.json({ transactions: r.rows, total: parseInt(countR.rows[0].count, 10), page: Number(page), limit: Number(limit) });
    }

    if (method === "POST") {
      const { date, category, subcategory, description, payment_method, type, amount, liability_name } = body;
      if (!date || !category || !payment_method || !type || amount == null) return res.status(400).json({ error: "Missing required fields" });
      const r = await pool.query(
        `INSERT INTO transactions (user_id,date,category,subcategory,description,payment_method,type,amount,liability_name) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [uid, date, category, subcategory || null, description || null, payment_method, type, amount, liability_name || null]
      );
      return res.status(201).json(r.rows[0]);
    }

    if (method === "PUT" && id) {
      const { date, category, subcategory, description, payment_method, type, amount, liability_name } = body;
      if (!date || !category || !payment_method || !type || amount == null) return res.status(400).json({ error: "Missing required fields" });
      const r = await pool.query(
        `UPDATE transactions SET date=$1,category=$2,subcategory=$3,description=$4,payment_method=$5,type=$6,amount=$7,liability_name=$8,updated_at=NOW() WHERE id=$9 AND user_id=$10 RETURNING *`,
        [date, category, subcategory || null, description || null, payment_method, type, amount, liability_name || null, id, uid]
      );
      if (r.rows.length === 0) return res.status(404).json({ error: "Not found" });
      return res.json(r.rows[0]);
    }

    if (method === "DELETE" && id) {
      const r = await pool.query("DELETE FROM transactions WHERE id=$1 AND user_id=$2 RETURNING *", [id, uid]);
      if (r.rows.length === 0) return res.status(404).json({ error: "Not found" });
      return res.json({ message: "Deleted", transaction: r.rows[0] });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Transactions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
