import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import IdleWarningModal from "./components/IdleWarningModal";
import { useAuth } from "./hooks/useAuth";

// Страницы
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import ManagerPage from "./pages/ManagerPage";
import BuhEscroy from "./pages/Buh_escroy";
import DeveloperDashboardBuilder from "./pages/DeveloperDashboardBuilder";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  const { token, role, loading, handleLogout } = useAuth();
  const navigate = useNavigate();

  const logoutAndRedirect = () => {
    handleLogout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Глобальная проверка бездействия */}
      {token && <IdleWarningModal timeoutMinutes={15} onLogout={logoutAndRedirect} />}

      <Routes>
        {/* Публичные роуты */}
        <Route path="/login" element={<LoginPage />} />

        {/* Защищённые роуты */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["viewer"]} />}>
          <Route path="/work" element={<ManagerPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["buh_user"]} />}>
          <Route path="/buh_user" element={<BuhEscroy />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["developer", "admin"]} />}>
          <Route
            path="/developer"
            element={<DeveloperDashboardBuilder token={token} role={role} />}
          />
        </Route>

        {/* Главная страница → редирект по роли */}
        <Route path="/" element={<RoleRedirect loading={loading} role={role} token={token} />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

function RoleRedirect({ role, loading, token }) {
  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Загрузка...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 🔹 если токен есть, но роль ещё не подтянулась → ждём
  if (!role) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Загрузка роли...</div>;
  }

  const redirects = {
    admin: "/admin",
    viewer: "/work",
    buh_user: "/buh_user",
    developer: "/developer",
  };

  const normalized = role?.trim().toLowerCase();

  if (normalized && redirects[normalized]) {
    return <Navigate to={redirects[normalized]} replace />;
  }

  console.warn("RoleRedirect: неизвестная или отсутствующая роль:", normalized);
  return <Navigate to="/login" replace />;
}

