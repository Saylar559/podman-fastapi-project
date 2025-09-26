import api from "./api";


// Получить список пользователей
export const getUsers = () => api.get("/admin/users").then(r => r.data);

// Создать пользователя
export const createUser = (data) => api.post("/admin/users", data).then(r => r.data);

// Удалить пользователя (по ID, не по username!)
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`).then(r => r.data);

// Получить статистику
export const getStats = () => api.get("/admin/stats").then(r => r.data);

