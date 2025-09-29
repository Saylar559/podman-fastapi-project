import { useEffect, useState } from "react";
import { getStats } from "../api/admin";

export default function StatsPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  if (!stats) return <p>Загрузка...</p>;

  return (
    <div>
      <h2>Статистика</h2>
      <ul>
        <li>Всего пользователей: {stats.total_users}</li>
        <li>Активны сегодня: {stats.active_today}</li>
        <li>Новые за неделю: {stats.new_this_week}</li>
        <li>Админов: {stats.admin_count}</li>
      </ul>
    </div>
  );
}

