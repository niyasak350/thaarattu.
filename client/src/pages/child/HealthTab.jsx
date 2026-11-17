import { useEffect, useState } from 'react';
import { api, formatDate, today } from '../../api';
import AddToggle from '../../components/AddToggle';

const TYPES = {
  fever: 'Fever',
  medicine: 'Medicine',
  doctor_visit: 'Doctor visit',
  symptom: 'Symptom',
  other: 'Other',
};
const empty = () => ({ record_date: today(), type: 'fever', title: '', details: '', temperature_c: '' });

export default function HealthTab({ child }) {
  const base = '/children/' + child.id + '/health';
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(empty());
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const load = () => api(base).then(setRecords);
  useEffect(() => { load(); }, [child.id]);

  async function add(e) {
    e.preventDefault();
    setError('');
    try {
      await api(base, 'POST', form);
      setForm(empty());
      setOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    await api(base + '/' + id, 'DELETE');
    load();
  }

  const shown = records.filter((r) => filter === 'all' || r.type === filter);

  return (
    <>
    <AddToggle label="Add a health record" open={open} onOpen={() => setOpen(true)}>
      <form className="card" onSubmit={add}>
        <h3>New health record</h3>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <label>Date
            <input name="record_date" type="date" max={today()} value={form.record_date} onChange={change} required />
          </label>
          <label>Type
            <select name="type" value={form.type} onChange={change}>
              {Object.entries(TYPES).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
            </select>
          </label>
          <label>Title
            <input name="title" value={form.title} onChange={change} required
              placeholder={form.type === 'medicine' ? 'Medicine name and dose' : 'Short description'} />
          </label>
          {form.type === 'fever' && (
            <label>Temperature (°C)
              <input name="temperature_c" type="number" step="0.1" min="34" max="43" value={form.temperature_c} onChange={change} />
            </label>
          )}
        </div>
        <label>Details (optional)
          <textarea name="details" rows="2" maxLength="500" value={form.details} onChange={change} />
        </label>
        <button>Save record</button>{' '}
        <button type="button" className="ghost" onClick={() => setOpen(false)}>Cancel</button>
      </form>
    </AddToggle>

    <section className="card">
      <div className="title-row">
        <h3>Medical history</h3>
        <select className="auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All types</option>
          {Object.entries(TYPES).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
        </select>
      </div>
      {shown.length === 0 ? <p className="muted">No records yet.</p> : (
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Details</th><th></th></tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id}>
                <td>{formatDate(r.record_date)}</td>
                <td><span className="badge">{TYPES[r.type]}</span></td>
                <td>
                  <b>{r.title}</b>{r.temperature_c && <> · {Number(r.temperature_c)} °C</>}
                  {r.details && <><br /><span className="muted">{r.details}</span></>}
                </td>
                <td><button className="link" onClick={() => remove(r.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
    </>
  );
}
