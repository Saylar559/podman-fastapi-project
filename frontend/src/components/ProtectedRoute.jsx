import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({
  allowedRoles,
  redirectPath = "/login",
  fallback = <div style={{ padding: "2rem", textAlign: "center" }}>Загрузка...</div>,
}) {
  const { role, loading } = useAuth();
  const location = useLocation();

  // Пока идёт загрузка (например, проверка /me или refresh)
  if (loading) {
    return fallback;
  }

  // Если роли нет — редирект на login, сохраняя откуда пришёл
  if (!role) {
    if (process.env.NODE_ENV === "development") {
      console.warn("ProtectedRoute: нет роли, редирект на", redirectPath);
    }
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Нормализуем роль
  const normalizedRole = role.trim().toLowerCase();

  // Приводим allowedRoles к массиву
  const rolesArray = Array.isArray(allowedRoles)
    ? allowedRoles.map((r) => r.trim().toLowerCase())
    : allowedRoles
    ? [allowedRoles.trim().toLowerCase()]
    : [];

  // Если список ролей задан и текущая роль не входит — редирект
  if (rolesArray.length > 0 && !rolesArray.includes(normalizedRole)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `ProtectedRoute: роль "${normalizedRole}" не разрешена, доступ только для: [${rolesArray.join(
          ", "
        )}]`
      );
    }
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Всё ок — рендерим вложенные роуты
  return <Outlet />;
}

