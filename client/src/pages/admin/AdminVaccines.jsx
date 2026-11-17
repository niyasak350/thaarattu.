import { useEffect, useState } from 'react';
import { api } from '../../api';
import AddToggle from '../../components/AddToggle';

const empty = { name: '', due_age_weeks: '', description: '' };

export default function AdminVaccines() {
  const [vaccines, setVaccines] = useState([]);
  const [form, setForm] = useState(empty); // has an id while editing
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const load = () => api('/admin/vaccines').then(setVaccines);
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      if (form.id) await api('/admin/vaccines/' + form.id, 'PUT', form);
      else await api('/admin/vaccines', 'POST', form);
      setForm(empty);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(v) {
    setForm({ ...v, description: v.description || '' });
    setOpen(true);
    window.scrollTo(0, 0);
  }

  async function remove(v) {
    if (!confirm('Delete ' + v.name + '? It will be removed from every child\'s schedule.')) return;
    await api('/admin/vaccines/' + v.id, 'DELETE');
    load();
  }

  return (
    <>
      <h2>Vaccine Master List</h2>
      <AddToggle label="Add a vaccine" open={open} onOpen={() => setOpen(true)}>
      <form className="card" onSubmit={save}>
        <h3>{form.id ? 'Edit vaccine' : 'Add a vaccine'}</h3>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <label>Name
            <input name="name" value={form.name} onChange={change} required />
          </label>
          <label>Due age (weeks)
            <input name="due_age_weeks" type="number" min="0" value={form.due_age_weeks} onChange={change} required />
          </label>
          <label>Description
            <input name="description" value={form.description} onChange={change} />
          </label>
        </div>
        <button>{form.id ? 'Save changes' : 'Add vaccine'}</button>{' '}
        <button type="button" className="ghost" onClick={() => { setForm(empty); setOpen(false); }}>Cancel</button>
        <p className="muted">
          New vaccines are added to the schedule of children registered after this. Changing the due
          age moves the due date of doses that are not given yet.
        </p>
      </form>
      </AddToggle>

      <section className="card">
        <table>
          <thead><tr><th>Vaccine</th><th>Due age</th><th>Description</th><th></th></tr></thead>
          <tbody>
            {vaccines.map((v) => (
              <tr key={v.id}>
                <td><b>{v.name}</b></td>
                <td>{v.due_age_weeks === 0 ? 'At birth' : v.due_age_weeks + ' weeks'}</td>
                <td>{v.description}</td>
                <td>
                  <button className="small" onClick={() => edit(v)}>Edit</button>{' '}
                  <button className="small danger" onClick={() => remove(v)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
