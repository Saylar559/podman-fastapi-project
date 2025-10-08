import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./LoginPage.css";

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
    <div className="lp-wrapper">
      <div className="lp-card">
        <h2 className="lp-title">Вход</h2>
        <form className="lp-form" onSubmit={onSubmit}>
          <div className="lp-group">
            <label htmlFor="username">Логин</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <div className="lp-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          {error && (
            <div id="login-error" className="lp-error" role="alert">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || loading}
            className="lp-submit-btn"
            aria-label={submitting || loading ? "Вход в процессе..." : "Войти в систему"}
          >
            {submitting || loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
