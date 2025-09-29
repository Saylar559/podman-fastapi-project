import { useState } from "react";
import { useUsers } from "../hooks/useUsers";

export default function UsersPage() {
  const { users, addUser, removeUser, updateUser, loading } = useUsers();
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    role: "viewer",
  });

  const [editRole, setEditRole] = useState({}); // хранит временные роли для редактирования

  const submit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.email) {
      alert("Заполните все поля");
      return;
    }
    await addUser(form);
    setForm({ username: "", password: "", email: "", role: "viewer" });
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

  return (
    <div className="content-card">
      <h2>Управление пользователями</h2>

      {/* Форма создания */}
      <form
        onSubmit={submit}
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <input
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="Username"
          className="input"
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password"
          className="input"
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          className="input"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="select"
        >
          <option value="admin">Админ</option>
          <option value="buh_user">Бухгалтер</option>
          <option value="viewer">Просмотр</option>
        </select>
        <button type="submit" className="analyze">
          Создать
        </button>
      </form>

      {/* Таблица пользователей */}
      {loading ? (
        <p className="placeholder-text">Загрузка...</p>
      ) : users.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px" }}>Username</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Email</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Роль</th>
              <th style={{ textAlign: "center", padding: "8px" }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.username}>
                <td style={{ padding: "8px" }}>{u.username}</td>
                <td style={{ padding: "8px" }}>{u.email}</td>
                <td style={{ padding: "8px" }}>
                  <select
                    value={editRole[u.username] ?? u.role}
                    onChange={(e) =>
                      handleRoleChange(u.username, e.target.value)
                    }
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
                    >
                      Сохранить
                    </button>
                  )}
                </td>
                <td style={{ textAlign: "center", padding: "8px" }}>
                  <button
                    onClick={() => removeUser(u.username)}
                    className="logout-btn"
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
    </div>
  );
}

