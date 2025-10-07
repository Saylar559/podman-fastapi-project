import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { handleLogin, token, role, loading, error } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 🔹 Если уже авторизован → сразу редиректим по роли
  if (token && role) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await handleLogin(username, password);
      // после логина → редиректим на "/" → RoleRedirect сам отправит по роли
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Ошибка входа:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "4rem auto", padding: "2rem", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2 style={{ textAlign: "center" }}>Вход</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Логин</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.3rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.3rem" }}
          />
        </div>
        {error && (
          <div style={{ color: "red", marginBottom: "1rem" }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting || loading}
          style={{
            width: "100%",
            padding: "0.7rem",
            background: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: submitting || loading ? "not-allowed" : "pointer",
          }}
        >
          {submitting || loading ? "Входим..." : "Войти"}
        </button>
      </form>
    </div>
  );
}

