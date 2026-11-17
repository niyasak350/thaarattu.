import { useState } from 'react';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const blank = {
  hospital_id: '', name: '', speciality: '', qualification: '', experience_years: '', fee: '',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], start_time: '10:00', end_time: '13:00',
  login_email: '', login_password: '',
};

// Form for adding or editing a doctor. Used by the site admin (who also picks the hospital)
// and by hospital administrators.
//   doctor:    the doctor being edited, or null for a new one
//   hospitals: list for the hospital chooser (site admin only)
//   onSave(body): must return a promise; errors are shown in the form
export default function DoctorForm({ doctor, hospitals, onSave, onCancel }) {
  const [form, setForm] = useState(doctor
    ? { ...blank, ...doctor, qualification: doctor.qualification || '', days: doctor.available_days.split(','), login_email: doctor.login_email || '', login_password: '' }
    : blank);
  const [error, setError] = useState('');
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const toggleDay = (day) => setForm({
    ...form, days: form.days.includes(day) ? form.days.filter((d) => d !== day) : [...form.days, day],
  });
  const hasLogin = doctor && doctor.login_email;

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await onSave({ ...form, available_days: DAYS.filter((d) => form.days.includes(d)).join(',') });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>{doctor ? 'Edit doctor' : 'Add a doctor'}</h3>
      {error && <p className="error">{error}</p>}
      <div className="row">
        {hospitals && (
          <label>Hospital
            <select name="hospital_id" value={form.hospital_id} onChange={change} required>
              <option value="">Choose...</option>
              {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}, {h.city}</option>)}
            </select>
          </label>
        )}
        <label>Name<input name="name" value={form.name} onChange={change} required /></label>
        <label>Speciality<input name="speciality" value={form.speciality} onChange={change} placeholder="e.g. Pediatrics" required /></label>
        <label>Qualification<input name="qualification" value={form.qualification} onChange={change} /></label>
        <label>Experience (years)<input name="experience_years" type="number" min="0" value={form.experience_years} onChange={change} /></label>
        <label>Fee (₹)<input name="fee" type="number" min="0" value={form.fee} onChange={change} /></label>
        <label>From<input name="start_time" type="time" value={form.start_time} onChange={change} required /></label>
        <label>To<input name="end_time" type="time" value={form.end_time} onChange={change} required /></label>
      </div>
      <p className="label">Available days</p>
      <div className="choices">
        {DAYS.map((d) => (
          <button type="button" key={d} className={form.days.includes(d) ? 'choice on' : 'choice'} onClick={() => toggleDay(d)}>{d}</button>
        ))}
      </div>

      <p className="label">Doctor's login {hasLogin ? '' : '(optional)'}</p>
      <div className="row">
        <label>Login email
          <input name="login_email" type="email" value={form.login_email} onChange={change} disabled={hasLogin} placeholder="doctor@example.com" />
        </label>
        <label>{hasLogin ? 'New password (leave empty to keep)' : 'Password (6+ characters)'}
          <input name="login_password" type="text" minLength="6" value={form.login_password} onChange={change} />
        </label>
      </div>
      <p className="muted">With a login the doctor can see their appointments, change their timing and view records that patients share.</p>
      <button>{doctor ? 'Save changes' : 'Add doctor'}</button>{' '}
      <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
    </form>
  );
}

// One row of the doctors table (shared by the admin and hospital admin pages)
export function DoctorRow({ d, onEdit, onDelete }) {
  return (
    <tr>
      <td><b>{d.name}</b><br /><span className="muted">{d.qualification} · {d.experience_years} yrs</span></td>
      <td>{d.speciality}<br /><span className="muted">₹{d.fee}</span></td>
      <td>{d.available_days.split(',').join(', ')}<br /><span className="muted">{d.start_time} to {d.end_time}</span></td>
      <td>{d.login_email ? <span className="badge ok">{d.login_email}</span> : <span className="muted">No login</span>}</td>
      <td className="nowrap">
        <button className="small" onClick={() => onEdit(d)}>Edit</button>{' '}
        <button className="small danger" onClick={() => onDelete(d)}>Delete</button>
      </td>
    </tr>
  );
}
