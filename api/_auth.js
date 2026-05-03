const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client();

/**
 * Verifies the Google ID token from the Authorization header.
 * Accepts expired tokens (up to 7 days old) — we trust the signature,
 * we just need the user's sub (Google ID) for data isolation.
 */
async function verifyAuth(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  const token = authHeader.split("Bearer ")[1];

  // First try strict verification (token not expired)
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
    // If token is expired but otherwise valid, decode it manually
    // Google tokens are signed — the payload is still trustworthy
    if (err.message && err.message.includes("Token used too late")) {
      try {
        const parts = token.split(".");
        if (parts.length !== 3) throw new Error("Invalid token format");
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

        // Verify it's from Google and for our app
        if (
          payload.iss !== "https://accounts.google.com" ||
          payload.aud !== process.env.GOOGLE_CLIENT_ID ||
          !payload.sub
        ) {
          throw new Error("Invalid token claims");
        }

        // Reject tokens older than 7 days
        const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
        if (Date.now() / 1000 > payload.exp + maxAge) {
          throw new Error("Token too old");
        }

        return {
          userId: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        };
      } catch (decodeErr) {
        console.error("Token decode failed:", decodeErr.message);
        res.status(401).json({ error: "Token expired, please sign in again" });
        return null;
      }
    }

    console.error("Auth verification failed:", err.message);
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

module.exports = { verifyAuth, setCors };
