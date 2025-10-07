import React, { useEffect, useState } from "react";
import "./DeveloperDashboardBuilder.css";
import { useAuth } from "../hooks/useAuth";

export default function DeveloperDashboardBuilder({
  token,
  role,
  baseUrl = "http://localhost:8000/api",
}) {
  const { handleLogout } = useAuth();
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const normalizedRole = role?.trim().toLowerCase();
  const hasAccess = normalizedRole === "developer" || normalizedRole === "admin";

  useEffect(() => {
    if (!hasAccess || !token) return;

    setLoading(true);
    setError(null);

    fetch(`${baseUrl}/dashboards`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Ошибка ${r.status}`);
        return r.json();
      })
      .then((data) => setDashboards(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [hasAccess, token, baseUrl]);

  if (!hasAccess) {
    return (
      <section className="content-card">
        <h2>403 — Доступ запрещён</h2>
        <p>Страница доступна только ролям <b>developer</b> и <b>admin</b>.</p>
      </section>
    );
  }

  if (loading) return <div className="loader">Загрузка дашбордов...</div>;
  if (error) return <div className="error-text">Ошибка загрузки: {error}</div>;

  return (
    <section className="dashboard-page">
      {/* 🔹 Верхняя панель */}
      <div className="dashboard-header">
        <h2>Конструктор дашбордов</h2>
        <div className="dashboard-actions">
          <button className="primary-btn">+ Новый дашборд</button>
          <button className="logout-btn" onClick={handleLogout}>Выйти</button>
        </div>
      </div>

      {/* 🔹 Список дашбордов */}
      {dashboards.length === 0 ? (
        <p className="empty-text">Пока нет дашбордов. Создайте новый!</p>
      ) : (
        <div className="dashboard-grid">
          {dashboards.map((d) => (
            <div key={d.id} className="dashboard-card">
              <h3>{d.title}</h3>
              <p>{d.description || "без описания"}</p>
              <div className="card-actions">
                <button className="secondary-btn">Открыть</button>
                <button className="danger-btn">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

