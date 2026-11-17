import { useEffect, useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, formatDate, today } from '../../api';

const energyLevels = ['Exhausted', 'Tired', 'Okay', 'Good', 'Energetic'];
const painLevels = ['None', 'Mild', 'Moderate', 'Strong', 'Severe'];

export default function SleepTab() {
  const [logs, setLogs] = useState([]);
  const [date, setDate] = useState(today());
  const [hours, setHours] = useState('');
  const [energy, setEnergy] = useState(3);
  const [pain, setPain] = useState(1);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const load = () => api('/wellness/sleep').then(setLogs);
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    await api('/wellness/sleep', 'POST', { log_date: date, sleep_hours: hours, energy, pain, note });
    setHours(''); setNote(''); setSaved(true);
    load();
  }

  const chartData = logs.map((l) => ({
    date: formatDate(l.log_date), Sleep: Number(l.sleep_hours), Energy: l.energy, Pain: l.pain,
  }));
  const week = logs.slice(-7);
  const avg = week.length ? (week.reduce((sum, l) => sum + Number(l.sleep_hours), 0) / week.length).toFixed(1) : null;
  const lastPain = logs.length ? logs[logs.length - 1].pain : 0;

  return (
    <>
      {avg != null && avg < 5 && (
        <div className="card notice">
          <b>Rest reminder:</b> you averaged {avg} hours of sleep over your last {week.length} entries.
          Try to nap when your baby naps, and ask your partner or family to take one night feed.
        </div>
      )}
      {lastPain >= 4 && (
        <div className="card notice">
          <b>You logged strong pain.</b> Please contact your doctor, especially if it comes with fever,
          heavy bleeding or swelling.
        </div>
      )}

      <form className="card" onSubmit={save}>
        <h3>Sleep & recovery log</h3>
        {saved && <p className="success">Saved.</p>}
        <div className="row">
          <label>Date
            <input type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label>Sleep in the last 24 hours (hours)
            <input type="number" step="0.5" min="0" max="24" value={hours} onChange={(e) => setHours(e.target.value)} required />
          </label>
        </div>
        <p className="label">Energy</p>
        <div className="choices">
          {energyLevels.map((text, i) => (
            <button type="button" key={text} className={energy === i + 1 ? 'choice on' : 'choice'}
              onClick={() => setEnergy(i + 1)}>{text}</button>
          ))}
        </div>
        <p className="label">Body pain / discomfort</p>
        <div className="choices">
          {painLevels.map((text, i) => (
            <button type="button" key={text} className={pain === i + 1 ? 'choice on' : 'choice'}
              onClick={() => setPain(i + 1)}>{text}</button>
          ))}
        </div>
        <label>Recovery note (optional)
          <textarea rows="2" maxLength="500" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button>Save</button>
      </form>

      <section className="card">
        <h3>Recovery progress {avg != null && <span className="muted">· average sleep {avg} h</span>}</h3>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData}>
              <CartesianGrid stroke="#e8eaee" vertical={false} />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis yAxisId="h" fontSize={12} unit=" h" />
              <YAxis yAxisId="l" orientation="right" domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="h" dataKey="Sleep" name="Sleep (hours)" fill="#f8cfe0" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Line yAxisId="l" dataKey="Energy" stroke="#7a8cf0" strokeWidth={2} />
              <Line yAxisId="l" dataKey="Pain" stroke="#5b77c7" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <p className="muted">Log two or more days to see your progress chart.</p>
        )}
      </section>
    </>
  );
}
