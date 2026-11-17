import { useEffect, useState } from 'react';
import { api, today } from '../../api';
import AddToggle from '../../components/AddToggle';

const empty = { title: '', checkup_date: '', checkup_time: '', place: '', notes: '' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CheckupsTab({ hasPregnancy }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty); // has an id while editing
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const load = () => api('/pregnancy/checkups').then(setItems);
  useEffect(() => { load(); }, []);

  async function run(action) {
    setError(''); setMessage('');
    try { await action(); load(); } catch (err) { setError(err.message); }
  }

  const save = (e) => {
    e.preventDefault();
    run(async () => {
      if (form.id) await api('/pregnancy/checkups/' + form.id, 'PUT', form);
      else await api('/pregnancy/checkups', 'POST', form);
      setForm(empty);
      setOpen(false);
    });
  };
  const toggleDone = (c) => run(() => api('/pregnancy/checkups/' + c.id, 'PUT', { ...c, done: !c.done }));
  const remove = (c) => { if (confirm('Delete "' + c.title + '"?')) run(() => api('/pregnancy/checkups/' + c.id, 'DELETE')); };
  const edit = (c) => {
    setForm({ ...c, checkup_time: c.checkup_time || '', place: c.place || '', notes: c.notes || '' });
    setOpen(true);
    window.scrollTo(0, 0);
  };
  const suggest = () => run(async () => {
    const data = await api('/pregnancy/checkups/suggest', 'POST');
    setMessage(data.added ? data.added + ' check-ups added. Change the dates to match what your doctor tells you.' : 'The typical schedule is already in your list.');
  });

  const upcoming = items.filter((c) => !c.done);
  const finished = items.filter((c) => c.done);

  const row = (c) => {
    const [, month, day] = c.checkup_date.split('-');
    const missed = !c.done && c.checkup_date < today();
    return (
      <div className={c.done ? 'checkup done' : 'checkup'} key={c.id}>
        <div className="when"><b>{Number(day)}</b><small>{MONTHS[month - 1]}</small></div>
        <div className="grow">
          <b>{c.title}</b> {missed && <span className="badge late">Missed</span>}
          {c.checkup_date === today() && !c.done && <span className="badge warn">Today</span>}
          <br />
          <span className="muted">
            {c.checkup_date.slice(0, 4)}{c.checkup_time && ' · ' + c.checkup_time}{c.place && ' · ' + c.place}
            {c.notes && ' · ' + c.notes}
          </span>
        </div>
        <div className="actions">
          <button className="small" onClick={() => toggleDone(c)}>{c.done ? 'Undo' : 'Done'}</button>
          <button className="small ghost" onClick={() => edit(c)}>Edit</button>
          <button className="small danger" onClick={() => remove(c)}>Delete</button>
        </div>
      </div>
    );
  };

  return (
    <>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <AddToggle label="Set a check-up date" open={open} onOpen={() => setOpen(true)}>
      <form className="card" onSubmit={save}>
        <h3>{form.id ? 'Edit check-up' : 'Set a check-up date'}</h3>
        <div className="row">
          <label>What is it?
            <input name="title" value={form.title} onChange={change} placeholder="e.g. Scan, doctor visit, blood test" required />
          </label>
          <label>Date
            <input name="checkup_date" type="date" value={form.checkup_date} onChange={change} required />
          </label>
          <label>Time (optional)
            <input name="checkup_time" type="time" value={form.checkup_time} onChange={change} />
          </label>
          <label>Place (optional)
            <input name="place" value={form.place} onChange={change} placeholder="Hospital or clinic" />
          </label>
        </div>
        <label>Notes (optional)
          <input name="notes" value={form.notes} onChange={change} placeholder="e.g. Bring previous reports, come fasting" />
        </label>
        <button>{form.id ? 'Save changes' : 'Add check-up'}</button>{' '}
        <button type="button" className="ghost" onClick={() => { setForm(empty); setOpen(false); }}>Cancel</button>
        <p className="muted">You will see an alert on the home page 14 days before each check-up, and if one is missed.</p>
      </form>
      </AddToggle>

      <section className="card">
        <div className="title-row">
          <h3>Upcoming check-ups</h3>
          {hasPregnancy && <button className="small ghost" onClick={suggest}>Add typical schedule</button>}
        </div>
        {upcoming.length === 0 && <p className="muted">No check-ups set. Add one above{hasPregnancy && ', or add the typical schedule for your pregnancy'}.</p>}
        {upcoming.map(row)}
      </section>

      {finished.length > 0 && (
        <section className="card">
          <h3>Completed</h3>
          {finished.map(row)}
        </section>
      )}
    </>
  );
}
