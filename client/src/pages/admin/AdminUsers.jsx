import { useEffect, useState } from 'react';
import { api, formatDate } from '../../api';
import { useAuth } from '../../AuthContext';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(null); // the user being edited
  const [error, setError] = useState('');
  const load = () => api('/admin/users').then(setUsers);
  useEffect(() => { load(); }, []);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function run(action) {
    setError('');
    try { await action(); load(); } catch (err) { setError(err.message); window.scrollTo(0, 0); }
  }
  const block = (u) => run(() => api(`/admin/users/${u.id}/block`, 'PUT', { blocked: !u.is_blocked }));
  const remove = (u) => {
    if (confirm('Delete ' + u.name + ' and all their data?')) run(() => api('/admin/users/' + u.id, 'DELETE'));
  };
  const save = (e) => {
    e.preventDefault();
    run(async () => { await api('/admin/users/' + form.id, 'PUT', form); setForm(null); });
  };

  return (
    <>
      <h2>Users</h2>
      {error && <p className="error">{error}</p>}

      {form && (
        <form className="card" onSubmit={save}>
          <h3>Edit user</h3>
          <div className="row">
            <label>Name<input name="name" value={form.name} onChange={change} required /></label>
            <label>Email<input name="email" type="email" value={form.email} onChange={change} required /></label>
            <label>Role
              <select name="role" value={form.role} onChange={change}>
                <option value="parent">Parent</option>
                <option value="doctor">Doctor</option>
                <option value="hospital_admin">Hospital admin</option>
                <option value="admin">Site admin</option>
              </select>
            </label>
            <label>New password (leave empty to keep)
              <input name="password" type="text" minLength="6" value={form.password} onChange={change} />
            </label>
          </div>
          <button>Save changes</button>{' '}
          <button type="button" className="ghost" onClick={() => setForm(null)}>Cancel</button>
        </form>
      )}

      <section className="card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Children</th><th>Joined</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className="badge">{u.role.replace('_', ' ')}</span></td>
                <td>{u.children}</td>
                <td>{formatDate(u.created_at)}</td>
                <td>{u.is_blocked ? <span className="badge late">Blocked</span> : <span className="badge ok">Active</span>}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="small" onClick={() => { setForm({ ...u, password: '' }); window.scrollTo(0, 0); }}>Edit</button>{' '}
                  {u.id !== me.id && (
                    <>
                      <button className="small ghost" onClick={() => block(u)}>{u.is_blocked ? 'Unblock' : 'Block'}</button>{' '}
                      <button className="small danger" onClick={() => remove(u)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
