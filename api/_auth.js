const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client();

/**
 * Verifies the Google ID token from the Authorization header.
 * Returns { userId, email, name, picture } or null if invalid.
 */
async function verifyAuth(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (err) {
    console.error("Auth verification failed:", err.message);
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
}

/**
 * Sets standard CORS headers including Authorization.
 */
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

module.exports = { verifyAuth, setCors };
