import api from "./axios";

// Получить список пользователей
export const getUsers = () => api.get("/api/admin/users").then(r => r.data);

// Создать пользователя
export const createUser = (data) => api.post("/api/admin/users", data).then(r => r.data);

// Удалить пользователя (по ID, не по username!)
export const deleteUser = (userId) => api.delete(`/api/admin/users/${userId}`).then(r => r.data);

// Получить статистику
export const getStats = () => api.get("/api/admin/stats").then(r => r.data);

