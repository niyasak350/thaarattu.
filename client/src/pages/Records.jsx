import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate, today } from '../api';
import { useLang } from '../i18n';
import Tabs from '../components/Tabs';
import AddToggle from '../components/AddToggle';
import RecordView, { PeriodPicker, usePeriod } from '../components/RecordView';

const TABS = ['My record', 'Health readings', 'Sharing with doctors'];
const empty = () => ({ record_date: today(), weight_kg: '', bp_high: '', bp_low: '', sugar: '', note: '' });

export default function Records() {
  const { t } = useLang();
  const [tab, setTab] = useState(TABS[0]);
  return (
    <>
      <h2>{t('healthRecord')}</h2>
      <p className="muted">Everything about you and your children in one place, by day, week or month.</p>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === TABS[0] && <MyRecord />}
      {tab === TABS[1] && <Readings />}
      {tab === TABS[2] && <Sharing />}
    </>
  );
}

function MyRecord() {
  const period = usePeriod();
  const [record, setRecord] = useState(null);
  useEffect(() => {
    api(`/records?from=${period.from}&to=${period.to}`).then(setRecord);
  }, [period.from, period.to]);
  return (
    <>
      <PeriodPicker period={period} />
      {record ? <RecordView record={record} /> : <p className="center">Loading...</p>}
    </>
  );
}

// Weight, blood pressure and sugar readings the mother notes down
function Readings() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty());
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const load = () => api('/records/vitals').then(setItems);
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/records/vitals', 'POST', form);
      setForm(empty()); setOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    await api('/records/vitals/' + id, 'DELETE');
    load();
  }

  return (
    <>
      <AddToggle label="Add a reading" open={open} onOpen={() => setOpen(true)}>
        <form className="card" onSubmit={save}>
          <h3>New reading</h3>
          {error && <p className="error">{error}</p>}
          <div className="row">
            <label>Date<input name="record_date" type="date" max={today()} value={form.record_date} onChange={change} required /></label>
            <label>Weight (kg)<input name="weight_kg" type="number" step="0.1" min="20" max="250" value={form.weight_kg} onChange={change} /></label>
            <label>BP upper<input name="bp_high" type="number" min="50" max="260" value={form.bp_high} onChange={change} placeholder="e.g. 120" /></label>
            <label>BP lower<input name="bp_low" type="number" min="30" max="180" value={form.bp_low} onChange={change} placeholder="e.g. 80" /></label>
            <label>Sugar (mg/dL)<input name="sugar" type="number" min="20" max="700" value={form.sugar} onChange={change} /></label>
          </div>
          <label>Note (optional)<input name="note" maxLength="300" value={form.note} onChange={change} placeholder="e.g. after breakfast, measured at clinic" /></label>
          <button>Save reading</button>{' '}
          <button type="button" className="ghost" onClick={() => setOpen(false)}>Cancel</button>
        </form>
      </AddToggle>

      <section className="card">
        <h3>My readings</h3>
        {items.length === 0 ? <p className="muted">No readings yet. Add your weight, blood pressure or sugar after each check-up.</p> : (
          <table>
            <thead><tr><th>Date</th><th>Weight</th><th>Blood pressure</th><th>Sugar</th><th>Note</th><th></th></tr></thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id}>
                  <td className="nowrap">{formatDate(v.record_date)}</td>
                  <td>{v.weight_kg ? Number(v.weight_kg) + ' kg' : '–'}</td>
                  <td>{v.bp_high ? v.bp_high + '/' + v.bp_low : '–'}</td>
                  <td>{v.sugar ? v.sugar + ' mg/dL' : '–'}</td>
                  <td>{v.note}</td>
                  <td><button className="link" onClick={() => remove(v.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

// The parent decides which doctors can see the record
function Sharing() {
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');
  const load = () => api('/records/doctors').then(setDoctors);
  useEffect(() => { load(); }, []);

  async function toggle(d) {
    setError('');
    try {
      await api('/records/doctors/' + d.id, 'PUT', { shared: !d.shared });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="card">
      <h3>Who can see my record</h3>
      <p className="muted">
        A doctor can see your health record only if you switch it on here (or tick the box when you book).
        They see your mood, sleep, screening scores, readings, check-ups and your children's growth, vaccines
        and health notes. Your journal and the private notes on your mood check-ins are never shared.
        You can switch it off at any time.
      </p>
      {error && <p className="error">{error}</p>}
      {doctors.length === 0 && (
        <p className="muted">You have not booked any doctor yet. <Link to="/hospitals">Find a doctor</Link> to share your record with.</p>
      )}
      {doctors.map((d) => (
        <label className="switch" key={d.id}>
          <span>{d.name}<small>{d.speciality} · {d.hospital}</small></span>
          <span>
            <span className={d.shared ? 'badge ok' : 'badge'}>{d.shared ? 'Shared' : 'Not shared'}</span>{' '}
            <input type="checkbox" className="auto" checked={!!d.shared} onChange={() => toggle(d)} style={{ width: 22, height: 22, display: 'inline-block', verticalAlign: 'middle' }} />
          </span>
        </label>
      ))}
    </section>
  );
}
