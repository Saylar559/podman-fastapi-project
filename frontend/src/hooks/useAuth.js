import { useState, useEffect } from "react";
import { login, refresh, getCurrentUser, logout as apiLogout } from "../api/auth";

export function useAuth() {
  const [loading, setLoading] = useState(true);   // ✅ по умолчанию true
  const [role, setRole] = useState(null);
  const [error, setError] = useState(null);

  const setAuth = (token, role) => {
    if (token) localStorage.setItem("access_token", token);
    if (role) {
      localStorage.setItem("role", role);
      setRole(role);
    }
  };

  const handleLogin = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await login(username, password);
      setAuth(data.access_token, data.role);
      return data.role;
    } catch (err) {
      setError(err?.response?.data?.detail || "Ошибка авторизации");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      const data = await refresh();
      setAuth(data.access_token, data.role);

      if (!data.role) {
        const user = await getCurrentUser();
        setAuth(data.access_token, user.role);
        return user.role;
      }

      return data.role;
    } catch {
      doLogout();
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setAuth(localStorage.getItem("access_token"), user.role);
      return user;
    } catch {
      setError("Сессия истекла");
      doLogout();
    }
  };

  const doLogout = () => {
    apiLogout?.(); // если в auth.js есть вызов API logout
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    setRole(null);
    setError(null);
  };

  // ✅ Автоинициализация при старте
  useEffect(() => {
    const init = async () => {
      try {
        // сначала пробуем refresh
        const refreshedRole = await handleRefresh();
        if (!refreshedRole) {
          // если refresh не сработал — пробуем /me
          await fetchCurrentUser();
        }
      } catch {
        // если всё упало — остаёмся без роли
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  return {
    handleLogin,
    handleRefresh,
    fetchCurrentUser,
    logout: doLogout,
    loading,
    role,
    error,
    setAuth,
  };
}

