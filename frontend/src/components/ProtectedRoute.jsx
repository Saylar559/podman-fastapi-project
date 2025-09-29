import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({
  allowedRoles,
  redirectPath = "/login",
  fallback = <div style={{ padding: "2rem", textAlign: "center" }}>Загрузка...</div>,
  children,
}) {
  const { role, loading } = useAuth();
  const location = useLocation();

  // Пока идёт загрузка (например, проверка /me или refresh)
  if (loading) {
    return fallback;
  }

  // Если пользователь не авторизован → редирект на login
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

  // Если список ролей задан и текущая роль не входит
  if (rolesArray.length > 0 && !rolesArray.includes(normalizedRole)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `ProtectedRoute: роль "${normalizedRole}" не разрешена, доступ только для: [${rolesArray.join(
          ", "
        )}]`
      );
    }
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
        <h2>403 — Доступ запрещён</h2>
        <p>У вас нет прав для просмотра этой страницы.</p>
      </div>
    );
  }

  // Всё ок — рендерим children или вложенные роуты
  return children ? children : <Outlet />;
}

