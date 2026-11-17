import { useEffect, useState } from 'react';
import { api } from '../../api';

// Times from the server are in UTC ("2026-11-15 10:30:00"); turn them into a Date
export const fromServer = (text) => new Date(text.replace(' ', 'T') + 'Z');
export const clock = (seconds) => String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
export const timeText = (date) => date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function KickTab() {
  const [sessions, setSessions] = useState([]);
  const [start, setStart] = useState(null); // Date when counting began
  const [kicks, setKicks] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const load = () => api('/pregnancy/kicks').then(setSessions);
  useEffect(() => { load(); }, []);

  // update the clock every second while counting
  useEffect(() => {
    if (!start) return;
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [start]);

  function tap() {
    if (!start) { setStart(new Date()); setSeconds(0); setKicks(1); } else setKicks(kicks + 1);
  }

  async function finish() {
    setError('');
    try {
      await api('/pregnancy/kicks', 'POST', { started_at: start.toISOString(), minutes: Math.round(seconds / 60), kicks });
      load();
    } catch (err) {
      setError(err.message);
    }
    setStart(null); setKicks(0); setSeconds(0);
  }

  async function remove(id) {
    await api('/pregnancy/kicks/' + id, 'DELETE');
    load();
  }

  return (
    <>
      <section className="card counter">
        <h3>Kick counter</h3>
        <p className="muted">Sit or lie comfortably. Tap the button each time you feel your baby move.</p>
        {error && <p className="error">{error}</p>}
        <div className="clock">{clock(seconds)}</div>
        <button className="big-tap" onClick={tap}><b>{kicks}</b>{start ? 'Tap for each kick' : 'Tap to start'}</button>
        {start && <div><button onClick={finish}>Finish and save</button></div>}
      </section>

      <section className="card">
        <h3>History</h3>
        {sessions.length === 0 ? <p className="muted">No sessions saved yet.</p> : (
          <table>
            <thead><tr><th>When</th><th>Kicks</th><th>Time taken</th><th></th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{timeText(fromServer(s.started_at))}</td>
                  <td><b>{s.kicks}</b></td>
                  <td>{s.minutes} min</td>
                  <td><button className="link" onClick={() => remove(s.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted">
          Many doctors suggest noticing how long your baby takes to make 10 movements, at the same time
          each day, from about week 28. If your baby is moving much less than usual, contact your doctor
          or hospital the same day.
        </p>
      </section>
    </>
  );
}
