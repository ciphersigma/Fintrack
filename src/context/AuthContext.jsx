import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { name, email, picture, credential }
  const [loading, setLoading] = useState(true);  // checking stored session

  // On mount, check localStorage for stored user
  useEffect(() => {
    const stored = localStorage.getItem("fintrack_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("fintrack_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((credentialResponse) => {
    // Decode the JWT to get user info (for display only — backend verifies the real token)
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
