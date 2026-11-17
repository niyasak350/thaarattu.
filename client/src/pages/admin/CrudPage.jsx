import { useEffect, useState } from 'react';
import { api } from '../../api';
import { readPhoto } from '../../photo';
import AddToggle from '../../components/AddToggle';

// One page that can list, add, edit and delete any admin-managed content.
// "config" (see AdminContent.jsx) says which fields the form has and what the table shows.
export default function CrudPage({ config }) {
  const blank = Object.fromEntries(config.fields.map((f) => [f.name, f.default ?? '']));
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank); // has an id while editing
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const url = '/admin/content/' + config.type;
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const load = () => api(url).then(setItems);
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      if (form.id) await api(url + '/' + form.id, 'PUT', form);
      else await api(url, 'POST', form);
      setForm(blank);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(item) {
    setOpen(true);
    // empty database values (null) become '' so the inputs stay controlled
    setForm(Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v ?? ''])));
    window.scrollTo(0, 0);
  }

  async function remove(item) {
    if (!confirm('Delete this item?')) return;
    await api(url + '/' + item.id, 'DELETE');
    load();
  }

  async function choosePhoto(name, file) {
    if (!file) return;
    const field = config.fields.find((f) => f.name === name);
    try { setForm({ ...form, [name]: await readPhoto(file, field.photo) }); } catch (err) { setError(err.message); }
  }

  const input = (f) => {
    if (f.type === 'image') {
      return (
        <span className="photo-pick">
          {form[f.name] && <img className="thumb" src={form[f.name]} alt="" />}
          <input type="file" accept="image/*" onChange={(e) => choosePhoto(f.name, e.target.files[0])} />
          {form[f.name] && <button type="button" className="small ghost" onClick={() => setForm({ ...form, [f.name]: '' })}>Remove</button>}
        </span>
      );
    }
    const common = { name: f.name, value: form[f.name], onChange: change, required: !f.optional };
    if (f.type === 'textarea') return <textarea rows="3" {...common} />;
    if (f.type === 'select') {
      return (
        <select {...common}>
          {f.options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
        </select>
      );
    }
    return <input type={f.type || 'text'} min={f.type === 'number' ? 0 : undefined} {...common} />;
  };
  const short = config.fields.filter((f) => f.type !== 'textarea');
  const long = config.fields.filter((f) => f.type === 'textarea');

  return (
    <>
      <h2>{config.title}</h2>
      {config.help && <p className="muted">{config.help}</p>}

      <AddToggle label="Add new" open={open} onOpen={() => setOpen(true)}>
      <form className="card" onSubmit={save}>
        <h3>{form.id ? 'Edit' : 'Add new'}</h3>
        {error && <p className="error">{error}</p>}
        <div className="row">
          {short.map((f) => <label key={f.name}>{f.label}{input(f)}</label>)}
        </div>
        {long.map((f) => <label key={f.name}>{f.label}{input(f)}</label>)}
        <button>{form.id ? 'Save changes' : 'Add'}</button>{' '}
        <button type="button" className="ghost" onClick={() => { setForm(blank); setOpen(false); }}>Cancel</button>
      </form>
      </AddToggle>

      <section className="card">
        {items.length === 0 ? <p className="muted">Nothing here yet.</p> : (
          <table>
            <thead><tr>{config.columns.map(([head]) => <th key={head}>{head}</th>)}<th></th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  {config.columns.map(([head, show], i) => <td key={head} className={i === 0 && config.columns.length > 1 ? 'nowrap' : ''}>{show(item)}</td>)}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="small" onClick={() => edit(item)}>Edit</button>{' '}
                    <button className="small danger" onClick={() => remove(item)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
