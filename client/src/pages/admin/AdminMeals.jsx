import { useEffect, useState } from 'react';
import { api } from '../../api';
import AddToggle from '../../components/AddToggle';

const empty = { min_months: '', max_months: '', meal_type: 'breakfast', title: '', recipe: '', allergens: '' };

export default function AdminMeals() {
  const [meals, setMeals] = useState([]);
  const [form, setForm] = useState(empty); // has an id while editing
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const load = () => api('/admin/meals').then(setMeals);
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      if (form.id) await api('/admin/meals/' + form.id, 'PUT', form);
      else await api('/admin/meals', 'POST', form);
      setForm(empty);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(m) {
    setForm({ ...m, recipe: m.recipe || '', allergens: m.allergens || '' });
    setOpen(true);
    window.scrollTo(0, 0);
  }

  async function remove(m) {
    if (!confirm('Delete "' + m.title + '"?')) return;
    await api('/admin/meals/' + m.id, 'DELETE');
    load();
  }

  return (
    <>
      <h2>Meal Plans</h2>
      <AddToggle label="Add a meal idea" open={open} onOpen={() => setOpen(true)}>
      <form className="card" onSubmit={save}>
        <h3>{form.id ? 'Edit meal idea' : 'Add a meal idea'}</h3>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <label>From age (months)<input name="min_months" type="number" min="0" value={form.min_months} onChange={change} required /></label>
          <label>To age (months)<input name="max_months" type="number" min="0" value={form.max_months} onChange={change} required /></label>
          <label>Meal
            <select name="meal_type" value={form.meal_type} onChange={change}>
              {['breakfast', 'lunch', 'snack', 'dinner', 'anytime'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label>Title<input name="title" value={form.title} onChange={change} required /></label>
          <label>Allergens<input name="allergens" value={form.allergens} onChange={change} placeholder="e.g. milk,nuts" /></label>
        </div>
        <label>Recipe<textarea name="recipe" rows="2" maxLength="1000" value={form.recipe} onChange={change} /></label>
        <button>{form.id ? 'Save changes' : 'Add meal'}</button>{' '}
        <button type="button" className="ghost" onClick={() => { setForm(empty); setOpen(false); }}>Cancel</button>
      </form>
      </AddToggle>

      <section className="card">
        <table>
          <thead><tr><th>Age</th><th>Meal</th><th>Title</th><th>Allergens</th><th></th></tr></thead>
          <tbody>
            {meals.map((m) => (
              <tr key={m.id}>
                <td>{m.min_months}-{m.max_months} months</td>
                <td>{m.meal_type}</td>
                <td><b>{m.title}</b><br /><span className="muted">{m.recipe}</span></td>
                <td>{m.allergens}</td>
                <td>
                  <button className="small" onClick={() => edit(m)}>Edit</button>{' '}
                  <button className="small danger" onClick={() => remove(m)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
