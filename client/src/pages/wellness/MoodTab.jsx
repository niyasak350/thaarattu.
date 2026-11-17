import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, formatDate } from '../../api';
import SupportNote from '../../components/SupportNote';

const moods = ['Very low', 'Low', 'Okay', 'Good', 'Great'];
const stressLevels = ['Calm', 'Mild', 'Moderate', 'High', 'Very high'];

export default function MoodTab() {
  const [logs, setLogs] = useState([]);
  const [mood, setMood] = useState(3);
  const [stress, setStress] = useState(3);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const load = () => api('/mood').then(setLogs);
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    await api('/mood', 'POST', { mood, stress, note });
    setNote('');
    setSaved(true);
    load();
  }

  const chartData = logs.map((l) => ({ date: formatDate(l.log_date), Mood: l.mood, Stress: l.stress }));

  // Three low days in a row: gently suggest talking to someone
  const lastThree = logs.slice(-3);
  const lowStreak = lastThree.length === 3 && lastThree.every((l) => l.mood <= 2);

  return (
    <>
      {lowStreak && (
        <SupportNote>
          <b>You have had a few hard days.</b> That is common after childbirth and it is not your fault.
        </SupportNote>
      )}

      <form className="card" onSubmit={save}>
        <h3>How are you today?</h3>
        {saved && <p className="success">Today's check-in is saved.</p>}
        <p className="label">Mood</p>
        <div className="choices">
          {moods.map((text, i) => (
            <button type="button" key={text} className={mood === i + 1 ? 'choice on' : 'choice'}
              onClick={() => setMood(i + 1)}>{text}</button>
          ))}
        </div>
        <p className="label">Stress</p>
        <div className="choices">
          {stressLevels.map((text, i) => (
            <button type="button" key={text} className={stress === i + 1 ? 'choice on' : 'choice'}
              onClick={() => setStress(i + 1)}>{text}</button>
          ))}
        </div>
        <label>Note (optional, only you can see this)
          <textarea rows="2" maxLength="500" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button>Save today's check-in</button>
      </form>

      <section className="card">
        <h3>Mood history (last 30 days)</h3>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#e8eaee" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} fontSize={12} />
              <Tooltip />
              <Legend />
              <Line dataKey="Mood" stroke="#5b77c7" strokeWidth={2} />
              <Line dataKey="Stress" stroke="#d6336c" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="muted">Check in on two or more days to see your chart.</p>
        )}
      </section>
    </>
  );
}
