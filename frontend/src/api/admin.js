// src/api/admin.js
import api from "./api";

/**
 * Получить список пользователей
 * @param {Object} params { search?, role?, limit?, offset?, order_by? }
 * @returns {Promise<{users: Array, total: number}>}
 */
export async function getUsers(params = {}) {
  const res = await api.get("/admin/users", { params });
  return res.data; // { users: [...], total: N }
}

/**
 * Создать пользователя
 * @param {Object} data { username, email, password, role }
 * @returns {Promise<any>}
 */
export async function createUser(data) {
  const res = await api.post("/admin/users", data);
  return res.data;
}

/**
 * Удалить пользователя (по username)
 * @param {string} username
 * @returns {Promise<any>}
 */
export async function deleteUser(username) {
  const res = await api.delete(`/admin/users/${encodeURIComponent(username)}`);
  return res.data;
}

/**
 * Обновить пользователя
 * @param {string} username
 * @param {Object} payload { role?, email?, password?, is_active? }
 * @returns {Promise<any>}
 */
export async function updateUser(username, payload) {
  const res = await api.put(`/admin/users/${encodeURIComponent(username)}`, payload);
  return res.data;
}

