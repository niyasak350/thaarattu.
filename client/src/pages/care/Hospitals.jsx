import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import Stars from '../../components/Stars';
import { useLang } from '../../i18n';

// Straight-line distance in km between two points (haversine formula)
export function distanceKm(lat1, lng1, lat2, lng2) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export default function Hospitals() {
  const { t } = useLang();
  const [hospitals, setHospitals] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [q, setQ] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [emergency, setEmergency] = useState(false);
  const [available, setAvailable] = useState(false);
  const [sort, setSort] = useState('name');
  const [me, setMe] = useState(null); // { lat, lng } once the user shares location
  const [locError, setLocError] = useState('');

  useEffect(() => { api('/care/specialities').then(setSpecialities); }, []);
  useEffect(() => {
    const params = new URLSearchParams({ q, speciality });
    if (emergency) params.set('emergency', '1');
    if (available) params.set('available', '1');
    api('/care/hospitals?' + params).then(setHospitals);
  }, [q, speciality, emergency, available]);

  function useMyLocation() {
    setLocError('');
    if (!navigator.geolocation) { setLocError('Location is not supported in this browser.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setSort('distance'); },
      () => setLocError('Could not get your location. Please allow location access.'));
  }

  // Add distance when we know where the user is, then sort
  const list = hospitals.map((h) => ({
    ...h,
    km: me && h.latitude ? distanceKm(me.lat, me.lng, Number(h.latitude), Number(h.longitude)) : null,
  }));
  if (sort === 'distance' && me) list.sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9));
  if (sort === 'rating') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  return (
    <>
      <div className="title-row">
        <h2>{t('doctors')}</h2>
        <Link to="/appointments" className="btn small ghost">{t('appointments')}</Link>
      </div>
      <section className="card">
        <div className="row">
          <label>Search by name or location
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Kochi" />
          </label>
          <label>Speciality
            <select value={speciality} onChange={(e) => setSpeciality(e.target.value)}>
              <option value="">All specialities</option>
              {specialities.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label>Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="name">City and name</option>
              <option value="rating">Patient rating</option>
              {me && <option value="distance">Distance from me</option>}
            </select>
          </label>
        </div>
        <label className="check">
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
          <span>Only hospitals with a doctor available today</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} />
          <span>Only hospitals with 24-hour emergency</span>
        </label>
        <button className="small" onClick={useMyLocation}>{me ? 'Location found' : 'Use my location to show distance'}</button>
        {locError && <p className="error">{locError}</p>}
      </section>

      {list.length === 0 && <p className="muted">No hospitals match your search.</p>}
      <div className="grid">
        {list.map((h) => (
          <Link key={h.id} to={'/hospitals/' + h.id} className="card hospital">
            <b>{h.name}</b>
            <span className="muted">{h.address}, {h.city}</span>
            <span><Stars rating={h.rating} /> {h.km != null && <span className="badge">{h.km.toFixed(1)} km away</span>}</span>
            <span className="muted">{h.doctor_count} {h.doctor_count === 1 ? 'doctor' : 'doctors'}{h.specialities && ' · ' + h.specialities}</span>
            {h.has_emergency === 1 && <span><span className="badge late">24-hour emergency</span></span>}
          </Link>
        ))}
      </div>
    </>
  );
}
