import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({
  allowedRoles = [],
  redirectPath = "/",
  fallback = <div style={{ padding: "2rem", textAlign: "center" }}>Загрузка...</div>,
  children,
}) {
  const { token, role, loading } = useAuth();
  const location = useLocation();

  // Пока идёт загрузка (инициализация токена/роли)
  if (loading) {
    return fallback;
  }

  // Если токена нет → сразу на логин
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Если токен есть, но роль ещё не подтянулась → ждём
  if (!role) {
    return fallback;
  }

  // Нормализуем роль
  const normalizedRole = role.trim().toLowerCase();

  // Нормализуем список разрешённых ролей
  const rolesArray = Array.isArray(allowedRoles)
    ? allowedRoles.map((r) => r.trim().toLowerCase())
    : allowedRoles
    ? [allowedRoles.trim().toLowerCase()]
    : [];

  // Если список ролей задан и текущая роль не входит
  if (rolesArray.length > 0 && !rolesArray.includes(normalizedRole)) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Если всё ок → рендерим детей или Outlet
  return children ? children : <Outlet />;
}

