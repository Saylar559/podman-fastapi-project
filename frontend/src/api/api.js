// src/api/api.js
import axios from "axios";
import { refresh, logout } from "./auth";

// Флаг для предотвращения параллельных refresh
let isRefreshing = false;
let refreshSubscribers = [];

// Уведомить всех ожидающих о новом токене
function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

// Базовый инстанс axios
const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // для refresh-cookie
});

// Интерцептор запросов: подставляем access_token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Интерцептор ответов: обработка 401 и централизованный refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const data = await refresh(); // POST /api/refresh
          const newToken = data.access_token;
          if (newToken) {
            localStorage.setItem("access_token", newToken);
          }
          isRefreshing = false;
          onRefreshed(newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (err) {
          isRefreshing = false;
          onRefreshed(null);
          logout();
          window.location.href = "/login";
          return Promise.reject(err);
        }
      }

      // Если refresh уже идёт — ждём его завершения
      return new Promise((resolve, reject) => {
        refreshSubscribers.push((newToken) => {
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          } else {
            reject(error);
          }
        });
      });
    }

    return Promise.reject(error);
  }
);

// Пинг бэка
export const ping = () => api.get("/ping").then((r) => r.data);

// Анализ Excel
export const analyzeExcel = (
  files,
  { filter_by_period = false, exclude_negative = false, year = null, month = null } = {}
) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));
  formData.append("filter_by_period", filter_by_period);
  formData.append("exclude_negative", exclude_negative);
  if (year !== null) formData.append("year", year);
  if (month !== null) formData.append("month", month);

  return api
    .post("/analyze-excel", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

// Скачивание отчёта
export const downloadExcel = async (files, options = {}) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));
  if (options.filter_by_period) formData.append("filter_by_period", true);
  if (options.exclude_negative) formData.append("exclude_negative", true);
  if (options.year) formData.append("year", options.year);
  if (options.month) formData.append("month", options.month);

  const response = await api.post("/analyze-excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type:
      response.headers["content-type"] ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "report.xlsx";
  link.click();
  URL.revokeObjectURL(link.href);
};

export default api;

