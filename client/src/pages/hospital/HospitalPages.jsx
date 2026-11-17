import { useEffect, useState } from 'react';
import { api, formatDate } from '../../api';
import AddToggle from '../../components/AddToggle';
import AppointmentList from '../../components/AppointmentList';
import DoctorForm, { DoctorRow } from '../../components/DoctorForm';
import Stars from '../../components/Stars';

function useHospital() {
  const [hospital, setHospital] = useState(null);
  const [error, setError] = useState('');
  const load = () => api('/hospital/me').then(setHospital).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  return { hospital, error, load };
}

// 1. The hospital's own details
export function HospitalHome() {
  const { hospital, error: loadError, load } = useHospital();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (hospital) setForm({ ...hospital, phone: hospital.phone || '', latitude: hospital.latitude || '', longitude: hospital.longitude || '', has_emergency: hospital.has_emergency === 1 });
  }, [hospital]);
  if (loadError) return <p className="error">{loadError}</p>;
  if (!form) return <p className="center">Loading...</p>;
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function save(e) {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await api('/hospital/me', 'PUT', form);
      setMessage('Saved.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h2>{hospital.name}</h2>
      <p className="muted">{hospital.doctors.length} {hospital.doctors.length === 1 ? 'doctor' : 'doctors'} listed. Parents see these details when they search.</p>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      <form className="card" onSubmit={save}>
        <h3>Hospital details</h3>
        <div className="row">
          <label>Name<input name="name" value={form.name} onChange={change} required /></label>
          <label>Address<input name="address" value={form.address} onChange={change} required /></label>
          <label>City<input name="city" value={form.city} onChange={change} required /></label>
          <label>Phone<input name="phone" value={form.phone} onChange={change} /></label>
          <label>Latitude<input name="latitude" type="number" step="any" value={form.latitude} onChange={change} /></label>
          <label>Longitude<input name="longitude" type="number" step="any" value={form.longitude} onChange={change} /></label>
        </div>
        <label className="check">
          <input name="has_emergency" type="checkbox" checked={form.has_emergency} onChange={change} />
          <span>Has 24-hour emergency</span>
        </label>
        <button>Save</button>
      </form>
    </>
  );
}

// 2. The hospital's doctors
export function HospitalDoctors() {
  const { hospital, error, load } = useHospital();
  const [editing, setEditing] = useState(null); // null = closed, {} = new doctor, {id...} = editing
  if (error) return <p className="error">{error}</p>;
  if (!hospital) return <p className="center">Loading...</p>;

  async function save(body) {
    if (editing.id) await api('/hospital/doctors/' + editing.id, 'PUT', body);
    else await api('/hospital/doctors', 'POST', body);
    setEditing(null);
    load();
  }
  async function remove(d) {
    if (!confirm('Delete ' + d.name + ' and their login?')) return;
    await api('/hospital/doctors/' + d.id, 'DELETE');
    load();
  }

  return (
    <>
      <h2>Doctors</h2>
      <AddToggle label="Add a doctor" open={!!editing} onOpen={() => setEditing({})}>
        <DoctorForm key={editing && editing.id} doctor={editing && editing.id ? editing : null} onSave={save} onCancel={() => setEditing(null)} />
      </AddToggle>
      <section className="card">
        {hospital.doctors.length === 0 ? <p className="muted">No doctors yet.</p> : (
          <table>
            <thead><tr><th>Doctor</th><th>Speciality</th><th>Timing</th><th>Login</th><th></th></tr></thead>
            <tbody>
              {hospital.doctors.map((d) => <DoctorRow key={d.id} d={d} onDelete={remove} onEdit={(x) => { setEditing(x); window.scrollTo(0, 0); }} />)}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

// 3. Appointments at this hospital
export function HospitalAppointments() {
  return (
    <>
      <h2>Appointments</h2>
      <AppointmentList url="/hospital/appointments" />
    </>
  );
}

// 4. What parents wrote about the hospital's doctors
export function HospitalReviews() {
  const [items, setItems] = useState(null);
  useEffect(() => { api('/hospital/reviews').then(setItems); }, []);
  return (
    <>
      <h2>Reviews</h2>
      {items && items.length === 0 && <p className="center">No reviews yet.</p>}
      {(items || []).map((r) => (
        <div className="card" key={r.id}>
          <Stars rating={r.rating} /> for <b>{r.doctor}</b>
          {r.comment && <p>{r.comment}</p>}
          <span className="muted">{r.parent} · {formatDate(r.created_at)}</span>
        </div>
      ))}
    </>
  );
}
