import React, { useEffect, useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
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
  const [successMessage, setSuccessMessage] = useState(null); // For toasts

  // States for creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // States for editing
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // States for widgets (future builder)
  const [selectedDashboardId, setSelectedDashboardId] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [widgetLoading, setWidgetLoading] = useState(false);
  const [showWidgetForm, setShowWidgetForm] = useState(false);
  const [newWidgetType, setNewWidgetType] = useState("text");
  const [newWidgetTitle, setNewWidgetTitle] = useState("");
  const [newWidgetContent, setNewWidgetContent] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Dark mode (demo feature)
  const [isDarkMode, setIsDarkMode] = useState(false);

  const normalizedRole = role?.trim().toLowerCase();
  const hasAccess = normalizedRole === "developer" || normalizedRole === "admin";

  // Widget types for dropdown
  const widgetTypes = useMemo(() => [
    { value: "text", label: "Текст" },
    { value: "chart", label: "График" },
    { value: "image", label: "Изображение" },
    { value: "analyzer", label: "Анализатор (Yandex Lens)" },
  ], []);

  // Filtered dashboards
  const filteredDashboards = useMemo(() => 
    dashboards.filter(d => 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [dashboards, searchQuery]
  );

  // Stats
  const stats = useMemo(() => ({
    totalDashboards: dashboards.length,
    totalWidgets: widgets.length,
    selectedDashboard: selectedDashboardId ? dashboards.find(d => d.id === selectedDashboardId)?.title : null,
  }), [dashboards, widgets, selectedDashboardId]);

  // 🔹 Fetch dashboards (memoized)
  const fetchDashboards = useCallback(async () => {
    if (!hasAccess || !token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/dashboards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Ошибка ${response.status}`);
      const data = await response.json();
      setDashboards(data);
    } catch (err) {
      setError(err.message);
      console.error("Fetch dashboards error:", err);
    } finally {
      setLoading(false);
    }
  }, [hasAccess, token, baseUrl]);

  // 🔹 Fetch widgets for selected dashboard (memoized)
  const fetchWidgets = useCallback(async (dashboardId) => {
    if (!dashboardId || !token) return;
    setWidgetLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/dashboards/${dashboardId}/widgets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Ошибка ${response.status}`);
      const data = await response.json();
      setWidgets(data);
    } catch (err) {
      setError(err.message);
      console.error("Fetch widgets error:", err);
    } finally {
      setWidgetLoading(false);
    }
  }, [token, baseUrl]);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  useEffect(() => {
    if (selectedDashboardId) {
      fetchWidgets(selectedDashboardId);
    } else {
      setWidgets([]);
    }
  }, [selectedDashboardId, fetchWidgets]);

  // 🔹 Show success toast
  const showSuccess = useCallback((message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // 🔹 Create dashboard (memoized)
  const createDashboard = useCallback(async () => {
    if (!newTitle.trim()) return;
    try {
      const response = await fetch(`${baseUrl}/dashboards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle, description: newDescription }),
      });
      if (!response.ok) throw new Error(`Ошибка ${response.status}`);
      setNewTitle("");
      setNewDescription("");
      setShowCreateForm(false);
      fetchDashboards();
      showSuccess("Дашборд создан!");
    } catch (err) {
      setError(err.message);
    }
  }, [newTitle, newDescription, token, baseUrl, fetchDashboards, showSuccess]);

  // 🔹 Delete dashboard (memoized)
  const deleteDashboard = useCallback(async (id) => {
    if (!window.confirm("Удалить дашборд?")) return;
    try {
      const response = await fetch(`${baseUrl}/dashboards/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Ошибка ${response.status}`);
      if (selectedDashboardId === id) {
        setSelectedDashboardId(null);
        setWidgets([]);
      }
      fetchDashboards();
      showSuccess("Дашборд удалён!");
    } catch (err) {
      setError(err.message);
    }
  }, [selectedDashboardId, token, baseUrl, fetchDashboards, showSuccess]);

  // 🔹 Start editing (memoized)
  const startEdit = useCallback((dashboard) => {
    setEditingId(dashboard.id);
    setEditTitle(dashboard.title);
    setEditDescription(dashboard.description || "");
  }, []);

  // 🔹 Save edit (memoized)
  const saveEdit = useCallback(async () => {
    if (!editTitle.trim()) return;
    try {
      const response = await fetch(`${baseUrl}/dashboards/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      if (!response.ok) throw new Error(`Ошибка ${response.status}`);
      setEditingId(null);
      fetchDashboards();
      showSuccess("Дашборд обновлён!");
    } catch (err) {
      setError(err.message);
    }
  }, [editTitle, editDescription, editingId, token, baseUrl, fetchDashboards, showSuccess]);

  // 🔹 Cancel edit
  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  // 🔹 Select dashboard for widgets (memoized)
  const selectDashboard = useCallback((id) => {
    setSelectedDashboardId(id);
  }, []);

  // 🔹 Create widget (memoized)
  const createWidget = useCallback(async () => {
    if (!newWidgetTitle.trim() || !selectedDashboardId) return;
    try {
      const response = await fetch(`${baseUrl}/dashboards/${selectedDashboardId}/widgets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          type: newWidgetType, 
          config: { title: newWidgetTitle, content: newWidgetContent } 
        }),
      });
      if (!response.ok) throw new Error(`Ошибка ${response.status}`);
      setNewWidgetTitle("");
      setNewWidgetContent("");
      setShowWidgetForm(false);
      fetchWidgets(selectedDashboardId);
      showSuccess("Виджет добавлен!");
    } catch (err) {
      setError(err.message);
    }
  }, [newWidgetTitle, newWidgetContent, newWidgetType, selectedDashboardId, token, baseUrl, fetchWidgets, showSuccess]);

  // 🔹 Delete widget (memoized)
  const deleteWidget = useCallback(async (widgetId) => {
    if (!window.confirm("Удалить виджет?")) return;
    try {
      const response = await fetch(`${baseUrl}/dashboards/${selectedDashboardId}/widgets/${widgetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Ошибка ${response.status}`);
      fetchWidgets(selectedDashboardId);
      showSuccess("Виджет удалён!");
    } catch (err) {
      setError(err.message);
    }
  }, [selectedDashboardId, token, baseUrl, fetchWidgets, showSuccess]);

  // 🔹 Export dashboard (demo: JSON download)
  const exportDashboard = useCallback(() => {
    if (!selectedDashboardId) return;
    const dashboard = dashboards.find(d => d.id === selectedDashboardId);
    if (dashboard) {
      const exportData = {
        dashboard: { ...dashboard, widgets },
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dashboard.title}-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess("Дашборд экспортирован!");
    }
  }, [selectedDashboardId, dashboards, widgets, showSuccess]);

  // 🔹 Toggle dark mode (demo)
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
    document.body.classList.toggle('dark-mode');
  }, []);

  // 🔹 Simple widget preview (memoized)
  const WidgetPreview = React.memo(({ widget }) => (
    <div className="ddb-widget-preview">
      <h4>{widget.config?.title || "Без заголовка"}</h4>
      {widget.type === "text" && <p>{widget.config?.content || "Текст виджета"}</p>}
      {widget.type === "chart" && <p>График: {widget.config?.content || "Данные графика"}</p>}
      {widget.type === "image" && <img src={widget.config?.content} alt="Image" style={{ maxWidth: "100%" }} />}
      {widget.type === "analyzer" && (
        <div>
          <p>Анализатор: {widget.config?.content || "Загрузите изображение"}</p>
          <input type="file" accept="image/*" />
        </div>
      )}
    </div>
  ));

  WidgetPreview.propTypes = {
    widget: PropTypes.object.isRequired,
  };

  if (!hasAccess) {
    return (
      <section className="ddb-content-card">
        <h2>403 — Доступ запрещён</h2>
        <p>Страница доступна только ролям <b>developer</b> и <b>admin</b>.</p>
      </section>
    );
  }

  if (loading) return <div className="ddb-loader">Загрузка дашбордов...</div>;
  if (error) return <div className="ddb-error-text">Ошибка загрузки: {error}</div>;

  const selectedDashboard = dashboards.find(d => d.id === selectedDashboardId);

  return (
    <section className={`ddb-dashboard-page ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* 🔹 Верхняя панель */}
      <div className="ddb-dashboard-header">
        <h2>Конструктор дашбордов</h2>
        <div className="ddb-dashboard-actions">
          <input
            type="text"
            placeholder="Поиск дашбордов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ddb-search-input"
          />
          <button 
            className="ddb-primary-btn" 
            onClick={() => setShowCreateForm(true)}
          >
            + Новый дашборд
          </button>
          <button className="ddb-secondary-btn" onClick={toggleDarkMode}>
            {isDarkMode ? '☀️' : '🌙'} Режим
          </button>
          <button className="ddb-logout-btn" onClick={handleLogout}>Выйти</button>
        </div>
      </div>

      {/* Success toast */}
      {successMessage && (
        <div className="ddb-toast ddb-success-toast">
          {successMessage}
        </div>
      )}

      {/* Stats card */}
      <div className="ddb-stats-card">
        <div className="ddb-stat-item">
          <h4>Дашбордов</h4>
          <p>{stats.totalDashboards}</p>
        </div>
        <div className="ddb-stat-item">
          <h4>Виджетов</h4>
          <p>{stats.totalWidgets}</p>
        </div>
        <div className="ddb-stat-item">
          <h4>Активный</h4>
          <p>{stats.selectedDashboard || "Нет"}</p>
        </div>
      </div>

      {/* 🔹 Форма создания дашборда */}
      {showCreateForm && (
        <div className="ddb-create-form-overlay">
          <div className="ddb-create-form">
            <h3>Новый дашборд</h3>
            <input
              type="text"
              placeholder="Название"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea
              placeholder="Описание"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <div className="ddb-form-actions">
              <button className="ddb-primary-btn" onClick={createDashboard}>Создать</button>
              <button className="ddb-secondary-btn" onClick={() => setShowCreateForm(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Список дашбордов */}
      {filteredDashboards.length === 0 ? (
        <p className="ddb-empty-text">Нет дашбордов по запросу. Создайте новый!</p>
      ) : (
        <div className="ddb-dashboard-grid">
          {filteredDashboards.map((d) => (
            <div key={d.id} className={`ddb-dashboard-card ${selectedDashboardId === d.id ? 'ddb-selected' : ''}`}>
              {editingId === d.id ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                  <div className="ddb-card-actions">
                    <button className="ddb-primary-btn" onClick={saveEdit}>Сохранить</button>
                    <button className="ddb-secondary-btn" onClick={cancelEdit}>Отмена</button>
                  </div>
                </>
              ) : (
                <>
                  <h3>{d.title}</h3>
                  <p>{d.description || "без описания"}</p>
                  <div className="ddb-card-actions">
                    <button 
                      className="ddb-secondary-btn" 
                      onClick={() => selectDashboard(d.id)}
                    >
                      {selectedDashboardId === d.id ? "Редактировать виджеты" : "Открыть"}
                    </button>
                    <button className="ddb-secondary-btn" onClick={() => startEdit(d)}>Редактировать</button>
                    <button className="ddb-danger-btn" onClick={() => deleteDashboard(d.id)}>Удалить</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 🔹 Секция билдера виджетов */}
      {selectedDashboard && (
        <div className="ddb-builder-section">
          <div className="ddb-builder-header">
            <h3>Билдер: {selectedDashboard.title}</h3>
            <button className="ddb-secondary-btn" onClick={exportDashboard}>📥 Экспорт JSON</button>
          </div>
          <button 
            className="ddb-primary-btn" 
            onClick={() => setShowWidgetForm(true)}
          >
            + Добавить виджет
          </button>

          {/* Форма виджета */}
          {showWidgetForm && (
            <div className="ddb-widget-form-overlay">
              <div className="ddb-widget-form">
                <h4>Новый виджет</h4>
                <select value={newWidgetType} onChange={(e) => setNewWidgetType(e.target.value)}>
                  {widgetTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Заголовок виджета"
                  value={newWidgetTitle}
                  onChange={(e) => setNewWidgetTitle(e.target.value)}
                />
                <textarea
                  placeholder="Содержимое (текст/URL/JSON)"
                  value={newWidgetContent}
                  onChange={(e) => setNewWidgetContent(e.target.value)}
                />
                <div className="ddb-form-actions">
                  <button className="ddb-primary-btn" onClick={createWidget}>Создать</button>
                  <button className="ddb-secondary-btn" onClick={() => setShowWidgetForm(false)}>Отмена</button>
                </div>
              </div>
            </div>
          )}

          {/* Список виджетов */}
          {widgetLoading ? (
            <div className="ddb-loader">Загрузка виджетов...</div>
          ) : widgets.length === 0 ? (
            <p className="ddb-empty-text">Нет виджетов. Добавьте первый!</p>
          ) : (
            <div className="ddb-widgets-grid">
              {widgets.map((w) => (
                <div key={w.id} className="ddb-widget-card">
                  <WidgetPreview widget={w} />
                  <div className="ddb-widget-actions">
                    <button className="ddb-secondary-btn">Редактировать</button>
                    <button className="ddb-danger-btn" onClick={() => deleteWidget(w.id)}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

DeveloperDashboardBuilder.propTypes = {
  token: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  baseUrl: PropTypes.string,
};

DeveloperDashboardBuilder.defaultProps = {
  baseUrl: "http://localhost:8000/api",
};
