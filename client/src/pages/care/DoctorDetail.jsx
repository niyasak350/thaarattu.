import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, formatDate, today } from '../../api';
import { useAuth } from '../../AuthContext';
import Stars from '../../components/Stars';

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [children, setChildren] = useState([]);

  // booking form
  const [date, setDate] = useState(today());
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState('');
  const [childId, setChildId] = useState('');
  const [booked, setBooked] = useState(null);
  const [share, setShare] = useState(false);
  const [error, setError] = useState('');

  // review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  const loadDoctor = () => api('/care/doctors/' + id).then((d) => {
    setDoctor(d);
    const mine = d.reviews.find((r) => r.user_id === user.id);
    if (mine) { setRating(mine.rating); setComment(mine.comment || ''); }
  }).catch(() => navigate('/hospitals'));
  const loadSlots = () => api(`/care/doctors/${id}/slots?date=${date}`).then((s) => { setSlots(s); setSlot(''); });

  useEffect(() => { loadDoctor(); api('/children').then(setChildren); }, [id]);
  useEffect(() => { loadSlots(); }, [id, date]);

  async function book(e) {
    e.preventDefault();
    setError('');
    if (!slot) { setError('Please pick a time slot.'); return; }
    try {
      await api('/care/appointments', 'POST', { doctor_id: Number(id), date, time_slot: slot, child_id: childId || null, share });
      if (share) loadDoctor();
      setBooked({ date, slot });
      loadSlots();
    } catch (err) {
      setError(err.message);
      loadSlots();
    }
  }

  async function sendReview(e) {
    e.preventDefault();
    setReviewError('');
    try {
      await api(`/care/doctors/${id}/reviews`, 'POST', { rating, comment });
      loadDoctor();
    } catch (err) {
      setReviewError(err.message);
    }
  }

  if (!doctor) return <p className="center">Loading...</p>;

  return (
    <>
      <p><Link to={'/hospitals/' + doctor.hospital_id}>&larr; {doctor.hospital_name}</Link></p>

      <section className="card">
        <h2>{doctor.name}</h2>
        <p>{doctor.speciality} · {doctor.qualification}</p>
        <div className="grid">
          <div className="tile"><span className="muted">Experience</span><b>{doctor.experience_years} years</b></div>
          <div className="tile"><span className="muted">Consultation fee</span><b>₹{doctor.fee}</b></div>
          <div className="tile"><span className="muted">Rating</span><b><Stars rating={doctor.rating} count={doctor.review_count} /></b></div>
        </div>
        <p className="muted">
          {doctor.hospital_name}, {doctor.city} · {doctor.available_days.split(',').join(', ')} · {doctor.start_time} to {doctor.end_time}
        </p>
      </section>

      <form className="card" onSubmit={book}>
        <h3>Book an appointment</h3>
        {booked && (
          <p className="success">
            Appointment confirmed for {formatDate(booked.date)} at {booked.slot}.{' '}
            <Link to="/appointments">View my appointments</Link>
          </p>
        )}
        {error && <p className="error">{error}</p>}
        <div className="row">
          <label>Date
            <input type="date" min={today()} value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label>Appointment for
            <select value={childId} onChange={(e) => setChildId(e.target.value)}>
              <option value="">Myself</option>
              {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <p className="label">Time slot</p>
        {slots.length === 0 ? (
          <p className="muted">No free slots on this date. Try another day ({doctor.available_days.split(',').join(', ')}).</p>
        ) : (
          <div className="choices">
            {slots.map((s) => (
              <button type="button" key={s} className={slot === s ? 'choice on' : 'choice'} onClick={() => setSlot(s)}>{s}</button>
            ))}
          </div>
        )}
        {doctor.shared ? (
          <p className="muted">This doctor can already see your health record. You can stop sharing under <Link to="/records">Records</Link>.</p>
        ) : (
          <label className="check">
            <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
            <span>Share my health record with this doctor</span>
          </label>
        )}
        <button disabled={!slot}>Confirm booking</button>
      </form>

      <section className="card">
        <h3>Reviews from parents</h3>
        {doctor.reviews.length === 0 && <p className="muted">No reviews yet.</p>}
        {doctor.reviews.map((r) => (
          <div key={r.id} className="review">
            <Stars rating={r.rating} /> <b>{r.name}</b> <span className="muted">· {formatDate(r.created_at)}</span>
            {r.comment && <p>{r.comment}</p>}
          </div>
        ))}

        {doctor.can_review ? (
          <form onSubmit={sendReview}>
            <p className="label">Your rating</p>
            {reviewError && <p className="error">{reviewError}</p>}
            <div className="choices">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} className={rating === n ? 'choice on' : 'choice'} onClick={() => setRating(n)}>{n} ★</button>
              ))}
            </div>
            <label>Comment (optional)
              <textarea rows="2" maxLength="500" value={comment} onChange={(e) => setComment(e.target.value)} />
            </label>
            <button>Save my review</button>
          </form>
        ) : (
          <p className="muted">You can rate this doctor after you have had an appointment with them.</p>
        )}
      </section>
    </>
  );
}
