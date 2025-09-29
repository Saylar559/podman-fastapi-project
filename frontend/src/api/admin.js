import api from "./api";

/**
 * Получить список пользователей
 * @param {Object} params { search, role, limit, offset, order_by }
 * @returns {Promise<{users: Array, total: number}>}
 */
export async function getUsers(params = {}) {
  try {
    const res = await api.get("/admin/users", { params });
    return res.data; // { users: [...], total: N }
  } catch (err) {
    console.error("Ошибка при получении списка пользователей:", err);
    throw err;
  }
}

/**
 * Создать пользователя
 * @param {Object} data { username, email, password, role }
 * @returns {Promise<{users: Array, total: number}>}
 */
export async function createUser(data) {
  try {
    const res = await api.post("/admin/users", data);
    return res.data;
  } catch (err) {
    console.error("Ошибка при создании пользователя:", err);
    throw err;
  }
}

/**
 * Удалить пользователя
 * @param {string} username
 * @returns {Promise<{users: Array, total: number}>}
 */
export async function deleteUser(username) {
  try {
    const res = await api.delete(`/admin/users/${encodeURIComponent(username)}`);
    return res.data;
  } catch (err) {
    console.error("Ошибка при удалении пользователя:", err);
    throw err;
  }
}

/**
 * Обновить пользователя (роль, email, пароль, статус)
 * @param {string} username
 * @param {Object} payload { role?, email?, password?, is_active? }
 * @returns {Promise<{users: Array, total: number}>}
 */
export async function updateUser(username, payload) {
  try {
    const res = await api.put(`/admin/users/${encodeURIComponent(username)}`, payload);
    return res.data;
  } catch (err) {
    console.error("Ошибка при обновлении пользователя:", err);
    throw err;
  }
}

