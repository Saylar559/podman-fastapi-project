import { useState, useEffect, useCallback } from "react";
import {
  getUsers,
  createUser,
  deleteUser,
  updateUser as apiUpdateUser, // 👈 API‑функция
} from "../api/admin";

export function useUsers(initialFilters = {}) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);

  // загрузка списка пользователей
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers(filters);
      setUsers(res.users);
      setTotal(res.total);
    } catch (err) {
      console.error("Ошибка при загрузке пользователей:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    users,
    total,
    filters,
    setFilters,
    loading,

    // создание пользователя
    addUser: async (data) => {
      try {
        await createUser(data);
        await load(); // 👈 сразу обновляем список
      } catch (err) {
        console.error("Ошибка при создании пользователя:", err);
        throw err;
      }
    },

    // удаление пользователя
    removeUser: async (username) => {
      try {
        await deleteUser(username);
        await load(); // 👈 обновляем список
      } catch (err) {
        console.error("Ошибка при удалении пользователя:", err);
        throw err;
      }
    },

    // обновление пользователя (роль, статус и т.д.)
    updateUser: async (username, payload) => {
      try {
        await apiUpdateUser(username, payload); // 👈 вызываем API
        await load(); // 👈 перезагружаем список
      } catch (err) {
        console.error("Ошибка при обновлении пользователя:", err);
        throw err;
      }
    },
  };
}

