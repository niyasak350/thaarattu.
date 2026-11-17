import { useEffect, useState } from 'react';
import { api } from '../../api';
import { clock, fromServer, timeText } from './KickTab';

export default function ContractionTab() {
  const [items, setItems] = useState([]); // newest first
  const [start, setStart] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const load = () => api('/pregnancy/contractions').then(setItems);
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!start) return;
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [start]);

  async function toggle() {
    if (!start) { setStart(new Date()); setSeconds(0); return; }
    const length = Math.max(1, Math.round((Date.now() - start) / 1000));
    await api('/pregnancy/contractions', 'POST', { started_at: start.toISOString(), seconds: length });
    setStart(null);
    load();
  }

  async function clear() {
    if (!confirm('Clear all recorded contractions?')) return;
    await api('/pregnancy/contractions', 'DELETE');
    load();
  }

  // minutes between the start of this contraction and the one before it
  const gap = (i) => (items[i + 1]
    ? Math.round((fromServer(items[i].started_at) - fromServer(items[i + 1].started_at)) / 60000)
    : null);
  const recent = items.slice(0, 5);
  const avgLength = recent.length ? Math.round(recent.reduce((sum, c) => sum + c.seconds, 0) / recent.length) : 0;
  const gaps = recent.map((c, i) => gap(i)).filter((g) => g != null);
  const avgGap = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null;

  return (
    <>
      <section className="card counter">
        <h3>Contraction timer</h3>
        <p className="muted">Press when a contraction starts and press again when it ends.</p>
        <div className="clock">{clock(seconds)}</div>
        <button className={start ? 'big-tap stop' : 'big-tap'} onClick={toggle}>
          {start ? 'Contraction ended' : 'Contraction started'}
        </button>
        {items.length > 0 && (
          <div className="facts" style={{ justifyContent: 'center' }}>
            <span><span className="muted">Average length (last {recent.length})</span><b>{avgLength} sec</b></span>
            {avgGap != null && <span><span className="muted">Average time apart</span><b>{avgGap} min</b></span>}
          </div>
        )}
      </section>

      <section className="card">
        <div className="title-row">
          <h3>Last 12 hours</h3>
          {items.length > 0 && <button className="small danger" onClick={clear}>Clear all</button>}
        </div>
        {items.length === 0 ? <p className="muted">Nothing recorded yet.</p> : (
          <table>
            <thead><tr><th>Started</th><th>Length</th><th>Time since previous</th></tr></thead>
            <tbody>
              {items.map((c, i) => (
                <tr key={c.id}>
                  <td>{timeText(fromServer(c.started_at))}</td>
                  <td>{c.seconds} sec</td>
                  <td>{gap(i) != null ? gap(i) + ' min' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted">
          Call your hospital when contractions become regular, stronger and closer together, or at once
          if your waters break, you bleed, or your baby moves less. Follow the plan your doctor gave you.
        </p>
      </section>
    </>
  );
}
