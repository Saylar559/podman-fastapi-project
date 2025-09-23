import api from "./axios";

// Получить список пользователей
export const getUsers = () => api.get("/admin/users").then(r => r.data);

// Создать пользователя
export const createUser = (data) => api.post("/admin/users", data).then(r => r.data);

// Удалить пользователя
export const deleteUser = (username) => api.delete(`/admin/users/${username}`).then(r => r.data);

// Получить статистику
export const getStats = () => api.get("/admin/stats").then(r => r.data);

