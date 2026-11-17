import { useEffect, useState } from 'react';
import { api } from '../../api';
import AddToggle from '../../components/AddToggle';
import DoctorForm, { DoctorRow } from '../../components/DoctorForm';

const emptyHospital = {
  name: '', address: '', city: '', phone: '', latitude: '', longitude: '', has_emergency: false,
  admin_email: '', admin_password: '',
};

// The site admin makes hospitals and (optionally) a login for each hospital's own administrator.
// The admin can also add and edit doctors of any hospital.
export default function AdminHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [hospital, setHospital] = useState(null); // null = form closed
  const [doctor, setDoctor] = useState(null);     // null = form closed
  const [error, setError] = useState('');
  const load = () => api('/admin/hospitals').then(setHospitals);
  useEffect(() => { load(); }, []);

  const change = (e) => setHospital({
    ...hospital, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  });

  async function saveHospital(e) {
    e.preventDefault();
    setError('');
    try {
      if (hospital.id) await api('/admin/hospitals/' + hospital.id, 'PUT', hospital);
      else await api('/admin/hospitals', 'POST', hospital);
      setHospital(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveDoctor(body) {
    if (doctor.id) await api('/admin/doctors/' + doctor.id, 'PUT', body);
    else await api('/admin/doctors', 'POST', body);
    setDoctor(null);
    load();
  }

  const editHospital = (h) => {
    setHospital({ ...emptyHospital, ...h, phone: h.phone || '', latitude: h.latitude || '', longitude: h.longitude || '', has_emergency: h.has_emergency === 1, admin_email: h.admin_email || '' });
    setDoctor(null);
    window.scrollTo(0, 0);
  };
  const editDoctor = (d) => { setDoctor(d); setHospital(null); window.scrollTo(0, 0); };
  const removeHospital = async (h) => {
    if (!confirm('Delete ' + h.name + ' with its doctors, logins and appointments?')) return;
    await api('/admin/hospitals/' + h.id, 'DELETE');
    load();
  };
  const removeDoctor = async (d) => {
    if (!confirm('Delete ' + d.name + ' and their login?')) return;
    await api('/admin/doctors/' + d.id, 'DELETE');
    load();
  };
  const hasAdmin = hospital && hospital.id && hospitals.find((h) => h.id === hospital.id)?.admin_email;

  return (
    <>
      <h2>Hospitals & Doctors</h2>
      <p className="muted">Give a hospital its own administrator login and they can manage their doctors and appointments themselves.</p>

      <AddToggle label="Add a hospital" open={!!hospital} onOpen={() => { setHospital(emptyHospital); setDoctor(null); }}>
        {hospital && (
          <form className="card" onSubmit={saveHospital}>
            <h3>{hospital.id ? 'Edit hospital' : 'Add a hospital'}</h3>
            {error && <p className="error">{error}</p>}
            <div className="row">
              <label>Name<input name="name" value={hospital.name} onChange={change} required /></label>
              <label>Address<input name="address" value={hospital.address} onChange={change} required /></label>
              <label>City<input name="city" value={hospital.city} onChange={change} required /></label>
              <label>Phone<input name="phone" value={hospital.phone} onChange={change} /></label>
              <label>Latitude<input name="latitude" type="number" step="any" value={hospital.latitude} onChange={change} placeholder="e.g. 11.2588" /></label>
              <label>Longitude<input name="longitude" type="number" step="any" value={hospital.longitude} onChange={change} placeholder="e.g. 75.7804" /></label>
            </div>
            <label className="check">
              <input name="has_emergency" type="checkbox" checked={hospital.has_emergency} onChange={change} />
              <span>Has 24-hour emergency</span>
            </label>
            <p className="label">Hospital administrator's login {hasAdmin ? '' : '(optional)'}</p>
            <div className="row">
              <label>Login email
                <input name="admin_email" type="email" value={hospital.admin_email} onChange={change} disabled={!!hasAdmin} placeholder="admin@hospital.com" />
              </label>
              <label>{hasAdmin ? 'New password (leave empty to keep)' : 'Password (6+ characters)'}
                <input name="admin_password" type="text" minLength="6" value={hospital.admin_password} onChange={change} />
              </label>
            </div>
            <button>{hospital.id ? 'Save changes' : 'Add hospital'}</button>{' '}
            <button type="button" className="ghost" onClick={() => setHospital(null)}>Cancel</button>
          </form>
        )}
      </AddToggle>

      {!hospital && (
        <AddToggle label="Add a doctor" open={!!doctor} onOpen={() => setDoctor({})}>
          <DoctorForm key={doctor && doctor.id} doctor={doctor && doctor.id ? doctor : null} hospitals={hospitals}
            onSave={saveDoctor} onCancel={() => setDoctor(null)} />
        </AddToggle>
      )}

      {hospitals.map((h) => (
        <section className="card" key={h.id}>
          <div className="title-row">
            <h3>{h.name}</h3>
            <span>
              <button className="small" onClick={() => editHospital(h)}>Edit</button>{' '}
              <button className="small danger" onClick={() => removeHospital(h)}>Delete</button>
            </span>
          </div>
          <p className="muted">
            {h.address}, {h.city}{h.has_emergency === 1 && ' · 24-hour emergency'} ·{' '}
            {h.admin_email ? <>Admin login: <b>{h.admin_email}</b></> : 'No hospital admin login yet'}
          </p>
          {h.doctors.length === 0 ? <p className="muted">No doctors yet.</p> : (
            <table>
              <thead><tr><th>Doctor</th><th>Speciality</th><th>Timing</th><th>Login</th><th></th></tr></thead>
              <tbody>
                {h.doctors.map((d) => <DoctorRow key={d.id} d={d} onEdit={editDoctor} onDelete={removeDoctor} />)}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </>
  );
}
