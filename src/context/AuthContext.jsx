import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

// Check if a JWT token is expired (with 5 min buffer)
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000; // convert to ms
    return Date.now() > exp - 5 * 60 * 1000; // expired or within 5 min of expiry
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check localStorage — but only if token is still valid
  useEffect(() => {
    const stored = localStorage.getItem("fintrack_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.credential && !isTokenExpired(parsed.credential)) {
          setUser(parsed);
        } else {
          // Token expired — clear it so user sees login page
          localStorage.removeItem("fintrack_user");
        }
      } catch {
        localStorage.removeItem("fintrack_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((credentialResponse) => {
    const token = credentialResponse.credential;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userData = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      credential: token,
    };
    setUser(userData);
    localStorage.setItem("fintrack_user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("fintrack_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
