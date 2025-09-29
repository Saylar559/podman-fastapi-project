import { useState, useEffect } from "react";
import { getUsers, createUser, deleteUser, updateUser } from "../api/admin";

export function useUsers(initialFilters = {}) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(initialFilters);

  // загрузка списка пользователей
  const load = async () => {
    try {
      const res = await getUsers(filters);
      setUsers(res.users);
      setTotal(res.total);
    } catch (err) {
      console.error("Ошибка при загрузке пользователей:", err);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  return {
    users,
    total,
    filters,
    setFilters,

    // создание пользователя
    addUser: async (data) => {
      try {
        const res = await createUser(data);
        setUsers(res.users);
        setTotal(res.total);
      } catch (err) {
        console.error("Ошибка при создании пользователя:", err);
        throw err;
      }
    },

    // удаление пользователя
    removeUser: async (username) => {
      try {
        const res = await deleteUser(username);
        setUsers(res.users);
        setTotal(res.total);
      } catch (err) {
        console.error("Ошибка при удалении пользователя:", err);
        throw err;
      }
    },

    // обновление пользователя (например, роли)
    updateUser: async (username, payload) => {
      try {
        const res = await updateUser(username, payload);
        setUsers(res.users);
        setTotal(res.total);
      } catch (err) {
        console.error("Ошибка при обновлении пользователя:", err);
        throw err;
      }
    },
  };
}

