import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import IdleWarningModal from "../components/IdleWarningModal";
import EscrowAnalyzer from "../components/EscrowAnalyzer";

export default function Buh_escroy() {
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  const logoutAndRedirect = () => {
    handleLogout();
    navigate("/login", { replace: true });
  };

  const data = [
    { title: "Баланс", value: 1250000 },
    { title: "Доходы", value: 320000 },
    { title: "Расходы", value: 210000 },
  ];

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="page-wrapper">
      {/* глобальный idle-logout */}
      <IdleWarningModal timeoutMinutes={15} onLogout={logoutAndRedirect} />

      <header className="header">
        <div className="header-top">
          <div>
            <h1 className="title">Панель бухгалтера</h1>
            <p className="subtitle">Финансовые отчёты и операции</p>
          </div>
          <button className="logout-btn" onClick={logoutAndRedirect}>
            Выйти
          </button>
        </div>
      </header>

      {/* Карточки с основными показателями */}
      <section className="cards">
        {data.map((item) => (
          <div key={item.title} className="card">
            <h2 className="card-title">{item.title}</h2>
            <p className="card-value">{formatCurrency(item.value)}</p>
          </div>
        ))}
      </section>

      {/* Новый модуль анализа Excel */}
      <section className="analyzer-section">
        <EscrowAnalyzer />
      </section>
    </div>
  );
}

