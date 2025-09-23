import { useState } from "react";
import { login } from "../api/auth";

export function useAuth() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    try {
      const data = await login(username, password);
      setAuth(data.access_token, data.role);
      return data.role; // возвращаем роль для navigate
    } finally {
      setLoading(false);
    }
  };

  const setAuth = (token: string, role: string) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("role", role);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  return { handleLogin, logout, loading, setAuth };
}

