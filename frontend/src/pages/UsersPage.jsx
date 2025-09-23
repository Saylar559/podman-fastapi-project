import { useState } from "react";
import { useUsers } from "../hooks/useUsers";

export default function UsersPage() {
  const { users, addUser, removeUser } = useUsers();
  const [form, setForm] = useState({ username: "", password: "", email: "", role: "user" });

  const submit = async (e) => {
    e.preventDefault();
    await addUser(form);
    setForm({ username: "", password: "", email: "", role: "user" });
  };

  return (
    <div>
      <h2>Users</h2>
      <form onSubmit={submit}>
        <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username" />
        <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" />
        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" />
        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Create</button>
      </form>

      <ul>
        {users.map(u => (
          <li key={u.username}>
            {u.username} ({u.role})
            <button onClick={() => removeUser(u.username)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

