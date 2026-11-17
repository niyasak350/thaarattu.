import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import Stars from '../../components/Stars';

export default function HospitalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  useEffect(() => {
    api('/care/hospitals/' + id).then(setHospital).catch(() => navigate('/hospitals'));
  }, [id]);
  if (!hospital) return <p className="center">Loading...</p>;

  return (
    <>
      <p><Link to="/hospitals">&larr; Hospitals</Link></p>
      <h2>{hospital.name}</h2>
      <p>
        {hospital.address}, {hospital.city}
        {hospital.phone && <> · <a href={'tel:' + hospital.phone}>{hospital.phone}</a></>}
        {hospital.has_emergency === 1 && <> · <span className="badge late">24-hour emergency</span></>}
      </p>
      {hospital.latitude && (
        <p><a target="_blank" rel="noreferrer"
          href={`https://www.google.com/maps/search/?api=1&query=${hospital.latitude},${hospital.longitude}`}>
          Open in Google Maps</a></p>
      )}

      <h3>Doctors</h3>
      {hospital.doctors.length === 0 && <p className="muted">No doctors listed yet.</p>}
      <div className="grid">
        {hospital.doctors.map((d) => (
          <Link key={d.id} to={'/doctors/' + d.id} className="card hospital">
            <b>{d.name}</b>
            <span className="muted">{d.speciality} · {d.qualification}</span>
            <span className="muted">{d.experience_years} years experience · ₹{d.fee}</span>
            <Stars rating={d.rating} count={d.review_count} />
            <span className="fake-link">View profile & book</span>
          </Link>
        ))}
      </div>
    </>
  );
}
