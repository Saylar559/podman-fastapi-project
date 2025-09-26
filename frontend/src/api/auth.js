import api from "./api";

/**
 * Логин
 */
export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  try {
    const res = await api.post("/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (res.data?.access_token) {
      localStorage.setItem("access_token", res.data.access_token);
    }
    if (res.data?.role) {
      localStorage.setItem("role", res.data.role);
    }

    return res.data;
  } catch (err) {
    return handleError("логине", err);
  }
};

/**
 * Обновление access_token по refresh_token (из cookie)
 */
export const refresh = async () => {
  try {
    const res = await api.post("/refresh", {});
    if (res.data?.access_token) {
      localStorage.setItem("access_token", res.data.access_token);
    }
    if (res.data?.role) {
      localStorage.setItem("role", res.data.role);
    }
    return res.data;
  } catch (err) {
    return handleError("обновлении токена", err);
  }
};

/**
 * Получение текущего пользователя
 */
export const getCurrentUser = async () => {
  try {
    const res = await api.get("/me");
    if (res.data?.role) {
      localStorage.setItem("role", res.data.role);
    }
    return res.data;
  } catch (err) {
    return handleError("получении пользователя", err);
  }
};

/**
 * Логаут (чистим localStorage)
 */
export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
};

/**
 * Универсальная обработка ошибок
 */
const handleError = (action, err) => {
  console.error(`Ошибка при ${action}:`, err?.response?.data || err.message);
  return Promise.reject(err);
};

