import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import ManagerPage from "./pages/ManagerPage"; // 🔹 вместо WorkPage
import NotFoundPage from "./pages/NotFoundPage"; // 🔹 добавим файл ниже

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Логин */}
        <Route path="/login" element={<LoginPage />} />

        {/* Админка — только для admin */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* Рабочая зона — только для user */}
        <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
          <Route path="/work" element={<ManagerPage />} />
        </Route>

        {/* Корень — редирект по роли */}
        <Route path="/" element={<RoleRedirect />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

function RoleRedirect() {
  const role = localStorage.getItem("role");
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "user") return <Navigate to="/work" replace />;
  return <Navigate to="/login" replace />;
}
