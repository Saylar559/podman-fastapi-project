import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import IdleWarningModal from "../components/IdleWarningModal";
import { useAuth } from "../hooks/useAuth";
import { useUsers } from "../hooks/useUsers";
import "./AdminPage.css";

export default function AdminPage() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  // форма создания пользователя
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    role: "viewer", // дефолтная роль
  });

  const [editRole, setEditRole] = useState({});
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const usernameRef = useRef(null);

  const { users, total, loading, addUser, removeUser, updateUser, setFilters } = useUsers({
    search,
    role: roleFilter ?? undefined,
    limit,
    offset: (page - 1) * limit,
  });

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.email) {
      alert("Заполните все поля");
      return;
    }
    if (form.password.length < 6) {
      alert("Пароль должен быть не короче 6 символов");
      return;
    }
    await addUser(form);
    setForm({ username: "", password: "", email: "", role: "viewer" });
    usernameRef.current?.focus();
  };

  const handleRoleChange = (username, newRole) => {
    setEditRole((prev) => ({ ...prev, [username]: newRole }));
  };

  const handleSaveRole = async (username) => {
    if (editRole[username]) {
      await updateUser(username, { role: editRole[username] });
      setEditRole((prev) => {
        const copy = { ...prev };
        delete copy[username];
        return copy;
      });
    }
  };

  const handleFilterChange = (newSearch, newRole) => {
    setPage(1);
    setFilters({
      search: newSearch,
      role: newRole ?? undefined,
      limit,
      offset: 0,
    });
  };

  return (
    <div className="admin-wrapper">
      <IdleWarningModal timeoutMinutes={15} onLogout={handleLogout} />

      <header className="admin-header">
        <h1 className="admin-title">Админ‑панель</h1>
        <nav className="admin-nav">
          {role === "admin" && <span className="nav-link">Пользователи</span>}
          {role === "admin" && <span className="nav-link">Статистика</span>}
          <button onClick={handleLogout} className="logout-btn">Выйти</button>
        </nav>
      </header>

      <main className="admin-main">
        {role === "admin" && (
          <>
            {/* Фильтры */}
            <section className="filters">
              <input
                ref={usernameRef}
                type="text"
                placeholder="Поиск по имени/email"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handleFilterChange(e.target.value, roleFilter);
                }}
                className="input"
              />
              <select
                value={roleFilter ?? ""}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setRoleFilter(val);
                  handleFilterChange(search, val);
                }}
                className="select"
              >
                <option value="">Все роли</option>
                <option value="admin">Админ</option>
                <option value="buh_user">Бухгалтер</option>
                <option value="viewer">Просмотр</option>
              </select>
            </section>

            {/* Управление пользователями */}
            <section className="content-card">
              <h2>Пользователи и роли</h2>
              <form
                onSubmit={submit}
                style={{ display: "flex", gap: "8px", marginBottom: "1rem", flexWrap: "wrap" }}
              >
                <input
                  ref={usernameRef}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Username"
                  className="input"
                  required
                  minLength={3}
                />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password"
                  className="input"
                  required
                  minLength={6}
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email"
                  className="input"
                  required
                />
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="select"
                  required
                >
                  <option value="admin">Админ</option>
                  <option value="buh_user">Бухгалтер</option>
                  <option value="viewer">Просмотр</option>
                </select>
                <button type="submit" className="analyze" disabled={loading}>
                  Создать
                </button>
              </form>

              {loading ? (
                <p className="placeholder-text">Загрузка...</p>
              ) : users.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Роль</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.username}>
                        <td>{u.username}</td>
                        <td>{u.email}</td>
                        <td>
                          <select
                            value={editRole[u.username] ?? u.role}
                            onChange={(e) => handleRoleChange(u.username, e.target.value)}
                            className="select"
                          >
                            <option value="admin">Админ</option>
                            <option value="buh_user">Бухгалтер</option>
                            <option value="viewer">Просмотр</option>
                          </select>
                          {editRole[u.username] && editRole[u.username] !== u.role && (
                            <button
                              onClick={() => handleSaveRole(u.username)}
                              className="analyze"
                              style={{ marginLeft: "6px" }}
                              disabled={loading}
                            >
                              Сохранить
                            </button>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => removeUser(u.username)}
                            className="logout-btn"
                            disabled={loading}
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="placeholder-text">Пользователей пока нет</p>
              )}
            </section>

            {/* Пагинация */}
            <div className="pagination">
              {Array.from({ length: Math.ceil(total / limit) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPage(i + 1);
                    setFilters({ search, role: roleFilter ?? undefined, limit, offset: i * limit });
                  }}
                  className={`page-btn ${page === i + 1 ? "active" : ""}`}
                  disabled={loading}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </>
        )}

        {role === "buh_user" && (
          <section className="content-card">
            <h2>Бухгалтерия</h2>
            <p>Здесь будут отчёты по ЭСКРОУ и выгрузки.</p>
          </section>
        )}

        {role === "viewer" && (
          <section className="content-card">
            <h2>Дашборды</h2>
            <p>Здесь будут доступные пользователю дашборды.</p>
          </section>
        )}
      </main>
    </div>
  );
}

