import { useEffect, useState } from "react";

export default function IdleWarningModal({ timeoutMinutes = 15, onLogout }) {
  const [idleTime, setIdleTime] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    let idleInterval;
    let events = ["mousemove", "keydown", "click", "scroll"];

    const resetIdle = () => {
      setIdleTime(0);
      setShowWarning(false);
    };

    const tick = () => {
      setIdleTime((prev) => {
        const next = prev + 1;
        if (next >= timeoutMinutes * 60 - 60) {
          // показываем предупреждение за 1 минуту до выхода
          setShowWarning(true);
        }
        if (next >= timeoutMinutes * 60) {
          onLogout();
        }
        return next;
      });
    };

    events.forEach((e) => window.addEventListener(e, resetIdle));
    idleInterval = setInterval(tick, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      clearInterval(idleInterval);
    };
  }, [timeoutMinutes, onLogout]);

  if (!showWarning) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#fff3cd",
        border: "1px solid #ffeeba",
        padding: "1rem",
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        zIndex: 1000,
      }}
    >
      <strong>⚠️ Вы бездействуете.</strong>
      <div>Через минуту произойдёт автоматический выход.</div>
      <button
        onClick={() => setShowWarning(false)}
        style={{
          marginTop: "0.5rem",
          padding: "0.3rem 0.8rem",
          border: "none",
          borderRadius: "4px",
          background: "#ffc107",
          cursor: "pointer",
        }}
      >
        Я здесь
      </button>
    </div>
  );
}

