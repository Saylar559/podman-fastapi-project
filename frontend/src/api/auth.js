import api from "./axios";

// Логин
export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);
  const res = await api.post("/auth/login", formData);
  return res.data; // { access_token, token_type, role }
};

// Получение текущего пользователя (если сделаешь /me на бэке)
export const getCurrentUser = async () => {
  const res = await api.get("/me");
  return res.data;
};

