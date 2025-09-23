import { useState, useEffect } from "react";
import { getUsers, createUser, deleteUser } from "../api/admin";

export function useUsers(initialFilters = {}) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(initialFilters);

  const load = async () => {
    const res = await getUsers(filters);
    setUsers(res.users);
    setTotal(res.total);
  };

  useEffect(() => { load(); }, [filters]);

  return {
    users,
    total,
    filters,
    setFilters,
    addUser: async (data) => {
      const res = await createUser(data);
      setUsers(res.users);
      setTotal(res.total);
    },
    removeUser: async (id) => {
      const res = await deleteUser(id);
      setUsers(res.users);
      setTotal(res.total);
    }
  };
}

