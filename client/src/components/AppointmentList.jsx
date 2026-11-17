import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate, today } from '../api';

const BADGE = { booked: 'badge', completed: 'badge ok', cancelled: 'badge late' };

// List of appointments with "Completed" and "Cancel" buttons.
// url: '/admin/appointments', '/hospital/appointments' or '/doctor/appointments'
// forDoctor: also shows a link to the patient's record when it is shared
export default function AppointmentList({ url, forDoctor }) {
  const [items, setItems] = useState(null);
  const [show, setShow] = useState('upcoming');
  const load = () => api(url).then(setItems);
  useEffect(() => { load(); }, [url]);

  async function setStatus(id, status) {
    await api(url + '/' + id, 'PUT', { status });
    load();
  }

  if (!items) return <p className="center">Loading...</p>;
  const shown = items.filter((a) => (show === 'upcoming' ? a.appt_date >= today() && a.status === 'booked' : !(a.appt_date >= today() && a.status === 'booked')));
  if (show === 'upcoming') shown.reverse(); // soonest first

  return (
    <>
      <div className="choices">
        <button type="button" className={show === 'upcoming' ? 'choice on' : 'choice'} onClick={() => setShow('upcoming')}>Upcoming</button>
        <button type="button" className={show === 'past' ? 'choice on' : 'choice'} onClick={() => setShow('past')}>Past and cancelled</button>
      </div>
      <section className="card">
        {shown.length === 0 ? <p className="muted">No appointments here.</p> : (
          <table>
            <thead><tr><th>When</th><th>Patient</th>{!forDoctor && <th>Doctor</th>}<th>Status</th><th></th></tr></thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.id}>
                  <td className="nowrap"><b>{formatDate(a.appt_date)}</b><br /><span className="muted">{a.time_slot}</span></td>
                  <td>
                    {a.parent}<br /><span className="muted">For: {a.child || 'the mother'}</span>
                    {forDoctor && (
                      <><br />{a.shared
                        ? <Link to={'/doctor/patients/' + a.user_id}>View health record</Link>
                        : <span className="muted">Record not shared</span>}</>
                    )}
                  </td>
                  {!forDoctor && <td>{a.doctor}<br /><span className="muted">{a.hospital}</span></td>}
                  <td><span className={BADGE[a.status]}>{a.status}</span></td>
                  <td className="nowrap">
                    {a.status === 'booked' && (
                      <>
                        <button className="small" onClick={() => setStatus(a.id, 'completed')}>Completed</button>{' '}
                        <button className="small danger" onClick={() => setStatus(a.id, 'cancelled')}>Cancel</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
