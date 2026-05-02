const { verifyAuth, setCors } = require("./_auth");

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const user = await verifyAuth(req, res);
  if (!user) return;

  res.json(user);
};
