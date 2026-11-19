import { createContext, useContext, useEffect, useRef, useState } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const hydrationStarted = useRef(false);
  const authActionStarted = useRef(false);

  useEffect(() => {
    if (hydrationStarted.current) return;
    hydrationStarted.current = true;
    api.get("/auth/me")
      .then(({ user: current }) => {
        if (!authActionStarted.current) setUser(current);
      })
      .catch(async (error) => {
        if (authActionStarted.current) return;
        if (error.status !== 401) {
          setUser(null);
          return;
        }
        try {
          const result = await api.post("/auth/refresh");
          if (!authActionStarted.current) setUser(result.user);
        } catch {
          if (!authActionStarted.current) setUser(null);
        }
      })
      .finally(() => {
        if (!authActionStarted.current) setLoading(false);
      });
  }, []);

  const value = {
    user,
    loading,
    async login(credentials) {
      authActionStarted.current = true;
      try {
        const result = await api.post("/auth/login", credentials);
        setUser(result.user);
        return result.user;
      } finally {
        setLoading(false);
      }
    },
    async register(details) {
      authActionStarted.current = true;
      try {
        const result = await api.post("/auth/register", details);
        setUser(result.user);
        return result.user;
      } finally {
        setLoading(false);
      }
    },
    async logout() {
      authActionStarted.current = true;
      await api.post("/auth/logout");
      setUser(null);
    }
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
