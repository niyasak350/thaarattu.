import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, formatDate, today } from '../../api';
import { whoMedian } from '../../whoData';
import AddToggle from '../../components/AddToggle';

// Age in months (with decimals) on a given date
const ageMonths = (dob, date) => (new Date(date) - new Date(dob)) / (1000 * 60 * 60 * 24 * 30.4375);

export default function GrowthTab({ child }) {
  const base = '/children/' + child.id + '/growth';
  const [growth, setGrowth] = useState([]);
  const [form, setForm] = useState({ record_date: today(), height_cm: '', weight_kg: '' });
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const load = () => api(base).then(setGrowth);
  useEffect(() => { load(); }, [child.id]);

  async function add(e) {
    e.preventDefault();
    setError('');
    try {
      await api(base, 'POST', {
        record_date: form.record_date,
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
      });
      setForm({ record_date: today(), height_cm: '', weight_kg: '' });
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

  // Chart points: the child's entries plus the WHO median for each month up to today's age
  function chartData(kind, field) {
    const points = growth.map((g) => ({
      age: Number(ageMonths(child.dob, g.record_date).toFixed(1)),
      child: Number(g[field]),
    }));
    const lastMonth = Math.min(60, Math.ceil(ageMonths(child.dob, today())) + 1);
    for (let m = 0; m <= lastMonth; m++) {
      const who = whoMedian(child.gender, kind, m);
      if (who != null) points.push({ age: m, who });
    }
    return points.sort((a, b) => a.age - b.age);
  }

  const bmi = (g) => (g.weight_kg / (g.height_cm / 100) ** 2).toFixed(1);
  const last = growth[growth.length - 1];
  const lastAge = last && ageMonths(child.dob, last.record_date);

  // Compare the latest entry with the WHO median
  function compare(kind, value, unit) {
    const median = last && whoMedian(child.gender, kind, lastAge);
    if (median == null) return null;
    const diff = (value - median).toFixed(1);
    return (
      <span className="muted">
        WHO median at this age: {median} {unit} ({diff > 0 ? '+' : ''}{diff})
      </span>
    );
  }

  const chart = (title, kind, field, unit, color) => (
    <div>
      <p className="label">{title}</p>
      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={chartData(kind, field)}>
          <CartesianGrid stroke="#e8eaee" />
          <XAxis dataKey="age" type="number" domain={[0, 'dataMax']} fontSize={12} unit=" mo" />
          <YAxis fontSize={12} unit={' ' + unit} domain={['auto', 'auto']} />
          <Tooltip labelFormatter={(age) => 'Age: ' + age + ' months'} />
          <Legend />
          <Line dataKey="who" name="WHO median" stroke="#9aa0ad" strokeDasharray="5 4" dot={false} connectNulls />
          <Line dataKey="child" name={child.name} stroke={color} strokeWidth={2} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <section className="card">
      <h3>Growth Tracker</h3>
      {last && (
        <div className="grid">
          <div className="tile"><span className="muted">Weight</span><b>{Number(last.weight_kg)} kg</b>{compare('weight', last.weight_kg, 'kg')}</div>
          <div className="tile"><span className="muted">Height</span><b>{Number(last.height_cm)} cm</b>{compare('height', last.height_cm, 'cm')}</div>
          <div className="tile"><span className="muted">BMI</span><b>{bmi(last)}</b><span className="muted">from the latest entry</span></div>
        </div>
      )}

      {growth.length > 0 ? (
        <div className="two">
          {chart('Weight by age', 'weight', 'weight_kg', 'kg', '#5b77c7')}
          {chart('Height by age', 'height', 'height_cm', 'cm', '#d6336c')}
        </div>
      ) : (
        <p className="muted">Add the first height and weight entry to see the charts.</p>
      )}

      {growth.length > 0 && (
        <table>
          <thead><tr><th>Date</th><th>Height</th><th>Weight</th><th>BMI</th><th></th></tr></thead>
          <tbody>
            {growth.map((g) => (
              <tr key={g.id}>
                <td>{formatDate(g.record_date)}</td>
                <td>{Number(g.height_cm)} cm</td>
                <td>{Number(g.weight_kg)} kg</td>
                <td>{bmi(g)}</td>
                <td><button className="link" onClick={() => remove(g.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <AddToggle label="Add height and weight" open={open || growth.length === 0} onOpen={() => setOpen(true)}>
      <form onSubmit={add}>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <label>Date
            <input name="record_date" type="date" min={child.dob} max={today()} value={form.record_date} onChange={change} required />
          </label>
          <label>Height (cm)
            <input name="height_cm" type="number" step="0.1" min="20" max="220" value={form.height_cm} onChange={change} required />
          </label>
          <label>Weight (kg)
            <input name="weight_kg" type="number" step="0.01" min="0.5" max="150" value={form.weight_kg} onChange={change} required />
          </label>
        </div>
        <button>Add entry</button>{' '}
        {growth.length > 0 && <button type="button" className="ghost" onClick={() => setOpen(false)}>Cancel</button>}
      </form>
      </AddToggle>
      <p className="muted">The dashed line is the WHO median for the child's age and gender. Children grow at different rates; ask your doctor if you are worried.</p>
    </section>
  );
}
