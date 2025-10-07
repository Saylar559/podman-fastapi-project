import IdleWarningModal from "../components/IdleWarningModal";
import { useAuth } from "../hooks/useAuth";

export default function ManagerPage() {
  const { logout } = useAuth();

  return (
    <div style={styles.container}>
      {/* Модалка отслеживания бездействия */}
      <IdleWarningModal timeoutMinutes={15} onLogout={logout} />

      <h1>Рабочая страница</h1>
      <p>Добро пожаловать! Здесь будет функционал для роли <b>user</b>.</p>

      <div style={styles.content}>
        <p>
          Здесь можно разместить рабочие инструменты, отчёты, задачи или панель управления для менеджеров.
        </p>
      </div>

      <button onClick={logout} style={styles.logoutBtn}>Выйти</button>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    maxWidth: "900px",
    margin: "0 auto"
  },
  content: {
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginTop: "20px"
  },
  logoutBtn: {
    marginTop: "20px",
    padding: "8px 12px",
    background: "#d63031",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  }
};

