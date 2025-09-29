import { useEffect, useState, useCallback } from "react";
import api from "../api/api";   // ✅ правильный импорт
import { useAuth } from "../hooks/useAuth";

export default function IdleWarningModal({ timeoutMinutes = 15 }) {
  const [idleTime, setIdleTime] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const { setAuth, logout } = useAuth();

  const resetIdleTime = useCallback(() => {
    setIdleTime(0);
    setShowModal(false);
  }, []);

  // Отслеживаем действия пользователя
  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach(e => window.addEventListener(e, resetIdleTime));
    return () => events.forEach(e => window.removeEventListener(e, resetIdleTime));
  }, [resetIdleTime]);

  // Счётчик бездействия (минуты)
  useEffect(() => {
    const interval = setInterval(() => {
      setIdleTime(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Логика показа модалки
  useEffect(() => {
    if (idleTime >= timeoutMinutes - 1 && idleTime < timeoutMinutes) {
      setShowModal(true);
    }
    if (idleTime >= timeoutMinutes) {
      handleLogout();
    }
  }, [idleTime]);

  const handleStay = async () => {
    try {
      const res = await api.post("/refresh", {}); // ✅ baseURL="/api" → /api/refresh
      setAuth(res.data.access_token, res.data.role);
      resetIdleTime();
    } catch {
      handleLogout();
    }
  };

  const handleLogout = () => {
    setShowModal(false);
    logout();
  };

  if (!showModal) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3>Вы бездействуете</h3>
        <p>Сессия скоро завершится. Хотите остаться в системе?</p>
        <div style={styles.buttons}>
          <button autoFocus onClick={handleStay}>Остаться</button>
          <button onClick={handleLogout}>Выйти</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000
  },
  modal: {
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "300px",
    textAlign: "center"
  },
  buttons: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: "15px"
  }
};

