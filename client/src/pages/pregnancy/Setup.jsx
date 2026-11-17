import { useState } from 'react';
import { api, today } from '../../api';

// Shown when there is no pregnancy yet, and when editing the dates
export default function PregnancySetup({ onSaved, onCancel }) {
  const [mode, setMode] = useState('lmp');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/pregnancy', 'POST', mode === 'lmp' ? { lmp_date: date } : { due_date: date });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card narrow" onSubmit={save}>
      <h3>Set up your pregnancy tracker</h3>
      <p className="muted">We use one date to work out your week and due date. You can change it later.</p>
      {error && <p className="error">{error}</p>}
      <div className="choices">
        <button type="button" className={mode === 'lmp' ? 'choice on' : 'choice'} onClick={() => setMode('lmp')}>First day of last period</button>
        <button type="button" className={mode === 'due' ? 'choice on' : 'choice'} onClick={() => setMode('due')}>Due date from my doctor</button>
      </div>
      <label>{mode === 'lmp' ? 'First day of your last period' : 'Your due date'}
        <input type="date" value={date} max={mode === 'lmp' ? today() : undefined} min={mode === 'due' ? today() : undefined}
          onChange={(e) => setDate(e.target.value)} required />
      </label>
      <button>Save</button>{' '}
      {onCancel && <button type="button" className="ghost" onClick={onCancel}>Cancel</button>}
    </form>
  );
}
