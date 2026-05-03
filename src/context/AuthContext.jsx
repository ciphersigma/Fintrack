import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const AuthContext = createContext();
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  // Silently refresh token using Google One Tap
  const silentRefresh = useCallback(() => {
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          const payload = decodeToken(response.credential);
          if (payload) {
            const userData = {
              name: payload.name,
              email: payload.email,
              picture: payload.picture,
              credential: response.credential,
            };
            setUser(userData);
            localStorage.setItem("fintrack_user", JSON.stringify(userData));
          }
        }
      },
      auto_select: true,
    });
    window.google.accounts.id.prompt(() => {}); // silent prompt
  }, []);

  // Schedule token refresh before expiry
  const scheduleRefresh = useCallback((token) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const payload = decodeToken(token);
    if (!payload?.exp) return;

    const expiresIn = payload.exp * 1000 - Date.now();
    // Refresh 5 minutes before expiry, minimum 10 seconds
    const refreshIn = Math.max(expiresIn - 5 * 60 * 1000, 10000);

    refreshTimer.current = setTimeout(() => {
      silentRefresh();
    }, refreshIn);
  }, [silentRefresh]);

  // On mount, restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("fintrack_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.credential && parsed.name) {
          // Always restore — backend accepts expired tokens up to 7 days
          setUser(parsed);

          // Check if token is expired and try silent refresh
          const payload = decodeToken(parsed.credential);
          if (payload?.exp && Date.now() > payload.exp * 1000) {
            // Token expired — try silent refresh in background
            setTimeout(silentRefresh, 1000);
          } else {
            // Token still valid — schedule refresh before expiry
            scheduleRefresh(parsed.credential);
          }
        } else {
          localStorage.removeItem("fintrack_user");
        }
      } catch {
        localStorage.removeItem("fintrack_user");
      }
    }
    setLoading(false);

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [silentRefresh, scheduleRefresh]);

  const login = useCallback((credentialResponse) => {
    const token = credentialResponse.credential;
    const payload = decodeToken(token);
    if (!payload) return;

    const userData = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      credential: token,
    };
    setUser(userData);
    localStorage.setItem("fintrack_user", JSON.stringify(userData));
    scheduleRefresh(token);
  }, [scheduleRefresh]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("fintrack_user");
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    // Revoke Google session
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
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
