import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatDate } from '../../api';
import AppointmentList from '../../components/AppointmentList';
import { DAYS } from '../../components/DoctorForm';
import RecordView, { PeriodPicker, usePeriod } from '../../components/RecordView';

// Shown on every doctor page if the login is not linked to a doctor profile
function useDoctor() {
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState('');
  const load = () => api('/doctor/me').then(setDoctor).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  return { doctor, error, load };
}

// 1. Appointments
export function DoctorAppointments() {
  const { doctor, error } = useDoctor();
  if (error) return <p className="error">{error}</p>;
  return (
    <>
      <h2>My appointments</h2>
      {doctor && <p className="muted">{doctor.name} · {doctor.speciality} · {doctor.hospital_name}, {doctor.city}</p>}
      {doctor && <AppointmentList url="/doctor/appointments" forDoctor />}
    </>
  );
}

// 2. Patients who shared their records
export function DoctorPatients() {
  const [patients, setPatients] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/doctor/patients').then(setPatients).catch((err) => setError(err.message)); }, []);
  if (error) return <p className="error">{error}</p>;
  return (
    <>
      <h2>Patient records</h2>
      <p className="muted">Parents who chose to share their health record with you. They can stop sharing at any time.</p>
      {patients && patients.length === 0 && <p className="center">No patient has shared a record with you yet.</p>}
      <div className="grid">
        {(patients || []).map((p) => (
          <Link key={p.id} to={'/doctor/patients/' + p.id} className="card child">
            <span className="avatar">{p.name[0].toUpperCase()}</span>
            <span>
              <b>{p.name}</b><br />
              <span className="muted">
                {p.children} {p.children === 1 ? 'child' : 'children'}
                {p.last_visit && ' · visit ' + formatDate(p.last_visit)}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

// 3. One patient's record, by day, week or month
export function DoctorPatient() {
  const { id } = useParams();
  const period = usePeriod();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setError('');
    api(`/doctor/patients/${id}/records?from=${period.from}&to=${period.to}`).then(setRecord).catch((err) => setError(err.message));
  }, [id, period.from, period.to]);

  return (
    <>
      <p><Link to="/doctor/patients">&larr; Patient records</Link></p>
      <h2>{record ? record.user.name : 'Health record'}</h2>
      {error && <p className="error">{error}</p>}
      <PeriodPicker period={period} />
      {record && !error && <RecordView record={record} />}
      <p className="muted">Entered by the patient in the app. Private journal entries and mood notes are not included.</p>
    </>
  );
}

// 4. The doctor's own timing and fee
export function DoctorTiming() {
  const { doctor, error: loadError, load } = useDoctor();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (doctor) setForm({ fee: doctor.fee, days: doctor.available_days.split(','), start_time: doctor.start_time, end_time: doctor.end_time });
  }, [doctor]);
  if (loadError) return <p className="error">{loadError}</p>;
  if (!form) return <p className="center">Loading...</p>;

  const toggleDay = (day) => setForm({ ...form, days: form.days.includes(day) ? form.days.filter((d) => d !== day) : [...form.days, day] });

  async function save(e) {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await api('/doctor/me', 'PUT', { ...form, available_days: DAYS.filter((d) => form.days.includes(d)).join(',') });
      setMessage('Saved. Patients now see your new timing.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h2>My timing</h2>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      <form className="card narrow" onSubmit={save}>
        <p className="label">Days I see patients</p>
        <div className="choices">
          {DAYS.map((d) => (
            <button type="button" key={d} className={form.days.includes(d) ? 'choice on' : 'choice'} onClick={() => toggleDay(d)}>{d}</button>
          ))}
        </div>
        <div className="row">
          <label>From<input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required /></label>
          <label>To<input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required /></label>
        </div>
        <label>Consultation fee (₹)<input type="number" min="0" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} /></label>
        <button>Save</button>
        <p className="muted">Patients book 30-minute slots between these times. Appointments already booked are not changed.</p>
      </form>
    </>
  );
}
