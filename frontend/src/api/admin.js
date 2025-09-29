import api from "./api";

// получить список пользователей
export async function getUsers(params) {
  const res = await api.get("/admin/users", { params });
  return res.data; // { users: [...], total: N }
}

// создать пользователя
export async function createUser(data) {
  // data = { username, email, password, role }
  const res = await api.post("/admin/users", data);
  return res.data; // { users: [...], total: N }
}

// удалить пользователя
export async function deleteUser(username) {
  const res = await api.delete(`/admin/users/${username}`);
  return res.data; // { users: [...], total: N }
}

// обновить пользователя (например, роль)
export async function updateUser(username, payload) {
  const res = await api.put(`/admin/users/${username}`, payload);
  return res.data; // { users: [...], total: N }
}

