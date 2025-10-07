import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./LoginPage.css";   // подключаем стили

export default function LoginPage() {
  const { handleLogin, token, role, loading, error } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (token && role) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await handleLogin(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Ошибка входа:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="login-title">Вход</h2>
        <form className="login-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label>Логин</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button
            type="submit"
            disabled={submitting || loading}
            className="primary-btn"
          >
            {submitting || loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

