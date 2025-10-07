import React, { useEffect, useState } from "react";
import "./DeveloperDashboardBuilder.css";
export default function DeveloperDashboardBuilder({ token, role, baseUrl = "/api" }) {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Проверка доступа
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
        if (!r.ok) {
          throw new Error(`Ошибка ${r.status}`);
        }
        return r.json();
      })
      .then((data) => setDashboards(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [hasAccess, token, baseUrl]);

  // Нет доступа
  if (!hasAccess) {
    return (
      <section className="content-card">
        <h2>403 — Доступ запрещён</h2>
        <p>Страница доступна только ролям <b>developer</b> и <b>admin</b>.</p>
      </section>
    );
  }

  // Загрузка
  if (loading) {
    return <div style={{ padding: "2rem" }}>Загрузка дашбордов...</div>;
  }

  // Ошибка
  if (error) {
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        Ошибка загрузки: {error}
      </div>
    );
  }

  // Основной UI
  return (
    <section className="content-card">
      <h2>Конструктор дашбордов</h2>
      {dashboards.length === 0 ? (
        <p>Пока нет дашбордов. Создайте новый!</p>
      ) : (
        <ul>
          {dashboards.map((d) => (
            <li key={d.id}>
              <strong>{d.title}</strong> — {d.description || "без описания"}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

