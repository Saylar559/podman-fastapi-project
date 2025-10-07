import { useEffect, useMemo, useState, useCallback } from "react";
import { login as apiLogin, logout as apiLogout, getCurrentUser } from "../api/auth";
import { useAuthContext } from "./AuthContext";

// 🔹 внутренний хук, создаёт состояние
export function useProvideAuth() {
  const [token, setToken] = useState(() => localStorage.getItem("access_token") || null);
  const [role, setRole] = useState(() => localStorage.getItem("role") || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setAuth = useCallback((newToken, newRole) => {
    if (newToken) {
      localStorage.setItem("access_token", newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem("access_token");
      setToken(null);
    }
    if (newRole) {
      localStorage.setItem("role", newRole);
      setRole(newRole);
    } else {
      localStorage.removeItem("role");
      setRole(null);
    }
  }, []);

  const handleLogin = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiLogin(username, password);
      setAuth(res?.access_token, res?.role);
      return res;
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Ошибка входа");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setAuth]);

  const handleLogout = useCallback(() => {
    try {
      apiLogout();
    } catch (e) {
      console.warn("Logout API error:", e);
    }
    setAuth(null, null);
    setError(null);
    setLoading(false);
  }, [setAuth]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const t = localStorage.getItem("access_token");
      if (t) {
        setLoading(true);
        try {
          const me = await getCurrentUser();
          if (!cancelled && me?.role) {
            setAuth(t, me.role);
          }
        } catch (e) {
          if (!cancelled) handleLogout();
        } finally {
          if (!cancelled) setLoading(false);
        }
      } else {
        setAuth(null, null);
        setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [setAuth, handleLogout]);

  return useMemo(
    () => ({
      token,
      role,
      loading,
      error,
      isAuthenticated: !!token,
      handleLogin,
      handleLogout,
      setAuth,
    }),
    [token, role, loading, error, handleLogin, handleLogout, setAuth]
  );
}

// 🔹 внешний хук для компонентов
export function useAuth() {
  return useAuthContext();
}

