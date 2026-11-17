import { useEffect, useState } from 'react';
import { api, formatDate, today } from '../../api';

// key is saved in the database, text is shown on screen
const TASKS = [
  ['water', 'Drank 8 glasses of water'],
  ['meals', 'Ate three proper meals'],
  ['fruit', 'Had fruit or vegetables'],
  ['supplements', 'Took supplements as prescribed'],
  ['rest', 'Rested or napped when the baby slept'],
  ['exercise', 'Gentle walk or postpartum exercise'],
  ['me_time', '15 minutes just for myself'],
  ['talk', 'Talked to a friend or family member'],
];

// Gentle postpartum exercises. General information only.
const EXERCISES = [
  ['Deep belly breathing', 'Lie on your back with knees bent. Breathe in slowly so your belly rises, breathe out and gently pull the belly in. 10 breaths.'],
  ['Pelvic floor squeeze', 'Tighten the muscles you would use to stop urine, hold for 5 seconds, relax for 5 seconds. Repeat 10 times, 3 times a day.'],
  ['Pelvic tilt', 'Lie on your back with knees bent. Flatten your lower back against the floor, hold 5 seconds, release. Repeat 10 times.'],
  ['Ankle circles', 'While sitting or lying down, rotate each ankle 10 times in each direction to help circulation.'],
  ['Short walk', 'Start with 5 to 10 minutes of slow walking and add a few minutes each week as you feel stronger.'],
];

const TIPS = [
  'Keep a water bottle where you feed the baby.',
  'Start exercise only after your doctor says it is safe, and begin slowly.',
  'Accept help with cooking and housework. Rest is part of recovery.',
  'Iron and protein rich foods (leafy greens, dal, eggs, fish) help recovery.',
];

export default function SelfCareTab() {
  const [date, setDate] = useState(today());
  const [done, setDone] = useState([]);
  const [week, setWeek] = useState([]);

  const load = () => api('/wellness/selfcare?date=' + date).then((data) => {
    setDone(data.done);
    setWeek(data.week);
  });
  useEffect(() => { load(); }, [date]);

  async function toggle(task) {
    await api('/wellness/selfcare', 'POST', { date, task, done: !done.includes(task) });
    load();
  }

  const percent = Math.round((done.length / TASKS.length) * 100);

  return (
    <>
      <section className="card">
        <div className="title-row">
          <h3>Self-care checklist</h3>
          <input className="auto" type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="progress"><div style={{ width: percent + '%' }} /></div>
        <p className="muted">{done.length} of {TASKS.length} done</p>
        {TASKS.map(([key, text]) => (
          <label key={key} className="check">
            <input type="checkbox" checked={done.includes(key)} onChange={() => toggle(key)} />
            <span className={done.includes(key) ? 'done' : ''}>{text}</span>
          </label>
        ))}
      </section>

      <section className="card">
        <h3>Last 7 days</h3>
        {week.length === 0 ? <p className="muted">Nothing ticked yet this week.</p> : (
          <table>
            <thead><tr><th>Date</th><th>Tasks done</th></tr></thead>
            <tbody>
              {week.map((w) => (
                <tr key={w.log_date}><td>{formatDate(w.log_date)}</td><td>{w.count} of {TASKS.length}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="label">Self-care tips</p>
        <ul>{TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>

      <section className="card">
        <h3>Postpartum exercises</h3>
        <p className="muted">
          Start only after your doctor says it is safe (this is usually later after a caesarean).
          Stop if you feel pain, dizziness or bleeding increases.
        </p>
        {EXERCISES.map(([title, text]) => (
          <p key={title}><b>{title}.</b> {text}</p>
        ))}
      </section>
    </>
  );
}
