import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate } from '../../api';
import { useLang } from '../../i18n';

const BADGE = { booked: 'badge', completed: 'badge ok', cancelled: 'badge late' };

export default function Appointments() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const load = () => api('/care/appointments').then(setItems);
  useEffect(() => { load(); }, []);

  async function cancel(a) {
    if (!confirm('Cancel this appointment?')) return;
    await api(`/care/appointments/${a.id}/cancel`, 'PUT');
    load();
  }

  return (
    <>
      <div className="title-row">
        <h2>{t('appointments')}</h2>
        <Link to="/hospitals">Book a new appointment</Link>
      </div>
      {items.length === 0 && <p className="muted">No appointments yet.</p>}
      {items.map((a) => (
        <div className="card" key={a.id}>
          <div className="title-row">
            <b>{formatDate(a.appt_date)} at {a.time_slot}</b>
            <span className={BADGE[a.status]}>{a.status}</span>
          </div>
          <p>
            <Link to={'/doctors/' + a.doctor_id}>{a.doctor}</Link> ({a.speciality}) · {a.hospital}, {a.city}
            <br /><span className="muted">For: {a.child || 'Myself'} · Fee ₹{a.fee}{a.phone && ' · Hospital phone ' + a.phone}</span>
          </p>
          {a.status === 'booked' && <button className="small danger" onClick={() => cancel(a)}>Cancel appointment</button>}
          {a.status !== 'cancelled' && <> <Link to={'/doctors/' + a.doctor_id}>Rate this doctor</Link></>}
        </div>
      ))}
    </>
  );
}
