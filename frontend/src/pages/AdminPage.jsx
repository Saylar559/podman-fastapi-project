import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import IdleWarningModal from "../components/IdleWarningModal";
import { useAuth } from "../hooks/useAuth";
import { useUsers } from "../hooks/useUsers";
import "./AdminPage.css";

export default function AdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate(); // ✅ для редиректа после выхода

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { users, total, setFilters } = useUsers({
    search,
    role,
    limit,
    offset: (page - 1) * limit,
  });

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
    setFilters({ search: e.target.value, role, limit, offset: 0 });
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setPage(1);
    setFilters({ search, role: e.target.value, limit, offset: 0 });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setFilters({ search, role, limit, offset: (newPage - 1) * limit });
  };

  // ✅ обработчик выхода с редиректом
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-wrapper">
      <IdleWarningModal timeoutMinutes={15} onLogout={handleLogout} />

      <header className="admin-header">
        <h1 className="admin-title">Админ-панель</h1>
        <nav className="admin-nav">
          <Link to="/admin/users" className="nav-link">Пользователи</Link>
          <Link to="/admin/stats" className="nav-link">Статистика</Link>
          <button onClick={handleLogout} className="logout-btn">Выйти</button>
        </nav>
      </header>

      <main className="admin-main">
        <section className="filters">
          <input
            type="text"
            placeholder="Поиск по имени/email"
            value={search}
            onChange={handleSearchChange}
            className="input"
          />
          <select value={role} onChange={handleRoleChange} className="select">
            <option value="">Все роли</option>
            <option value="admin">Админ</option>
            <option value="user">Пользователь</option>
            <option value="moderator">Модератор</option>
          </select>
        </section>

        <section className="content-card">
          <p className="placeholder-text">Выберите раздел админки в меню выше.</p>
        </section>

        <div className="pagination">
          {Array.from({ length: Math.ceil(total / limit) }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={`page-btn ${page === i + 1 ? "active" : ""}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

