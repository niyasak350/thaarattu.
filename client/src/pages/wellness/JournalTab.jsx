import { useEffect, useState } from 'react';
import { api, formatDate, today } from '../../api';

export default function JournalTab() {
  const [entries, setEntries] = useState([]);
  const [text, setText] = useState('');
  const [date, setDate] = useState(today());
  const [error, setError] = useState('');
  const load = () => api('/wellness/journal').then(setEntries);
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/wellness/journal', 'POST', { entry_date: date, text });
      setText('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this entry?')) return;
    await api('/wellness/journal/' + id, 'DELETE');
    load();
  }

  return (
    <>
      <form className="card" onSubmit={save}>
        <div className="title-row">
          <h3>Write in your journal</h3>
          <input className="auto" type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        {error && <p className="error">{error}</p>}
        <textarea rows="5" maxLength="2000" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="How was your day? What are you grateful for? What is on your mind?" required />
        <p className="muted">Only you can read your journal.</p>
        <button>Save entry</button>
      </form>

      <section className="card">
        <h3>My entries</h3>
        {entries.length === 0 && <p className="muted">Nothing written yet.</p>}
        {entries.map((entry) => (
          <div className="entry" key={entry.id}>
            <div className="title-row">
              <b>{formatDate(entry.entry_date)}</b>
              <button className="link" onClick={() => remove(entry.id)}>Delete</button>
            </div>
            <p>{entry.text}</p>
          </div>
        ))}
      </section>
    </>
  );
}
