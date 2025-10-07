// src/api/auth.js
import api from "./api";

// Нормализация ролей (user → viewer)
const normalizeRole = (r) => {
  if (!r) return null;
  const val = r.trim().toLowerCase();
  if (val === "user") return "viewer";
  return val; // admin, viewer, buh_user, developer — остаются как есть
};

/**
 * Логин
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{access_token: string, role: string, username: string}>}
 */
export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const res = await api.post("/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (res.data?.access_token) {
    localStorage.setItem("access_token", res.data.access_token);
  }
  if (res.data?.role) {
    localStorage.setItem("role", normalizeRole(res.data.role));
  }

  return {
    ...res.data,
    role: normalizeRole(res.data.role),
  };
};

/**
 * Refresh токена (используется в api.js при 401)
 * @returns {Promise<{access_token: string, role: string, username: string}>}
 */
export const refresh = async () => {
  const res = await api.post("/refresh");

  if (res.data?.access_token) {
    localStorage.setItem("access_token", res.data.access_token);
  }
  if (res.data?.role) {
    localStorage.setItem("role", normalizeRole(res.data.role));
  }

  return {
    ...res.data,
    role: normalizeRole(res.data.role),
  };
};

/**
 * Получение текущего пользователя
 * @returns {Promise<{id: number, username: string, email: string, role: string}>}
 */
export const getCurrentUser = async () => {
  const res = await api.get("/me");
  if (res.data?.role) {
    localStorage.setItem("role", normalizeRole(res.data.role));
  }
  return {
    ...res.data,
    role: normalizeRole(res.data.role),
  };
};

/**
 * Логаут (чистим localStorage)
 */
export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
};

