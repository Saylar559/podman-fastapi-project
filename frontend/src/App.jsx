import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";

import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import ManagerPage from "./pages/ManagerPage";
import NotFoundPage from "./pages/NotFoundPage";
import Buh_escroy from "./pages/Buh_escroy";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Публичные роуты */}
        <Route path="/login" element={<LoginPage />} />

        {/* Защищённые роуты */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
          <Route path="/work" element={<ManagerPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["buh_user"]} />}>
          <Route path="/buh_user" element={<Buh_escroy />} />
        </Route>

        {/* Главная страница → редирект по роли */}
        <Route path="/" element={<RoleRedirect />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

function RoleRedirect() {
  const { role, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Загрузка...</div>;
  }

  // Словарь редиректов по ролям
  const redirects = {
    admin: "/admin",
    user: "/work",
    buh_user: "/buh_user",
  };

  // Если роль известна и есть маршрут → редиректим
  if (role && redirects[role.trim().toLowerCase()]) {
    return <Navigate to={redirects[role.trim().toLowerCase()]} replace />;
  }

  // Если роли нет или она не распознана → на логин
  return <Navigate to="/login" replace />;
}

