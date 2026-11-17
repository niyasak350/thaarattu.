import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api('/admin/stats').then(setStats); }, []);
  if (!stats) return <p className="center">Loading...</p>;

  const tiles = [
    ['Parents', stats.parents],
    ['Active pregnancies', stats.pregnancies],
    ['Children', stats.children],
    ['Vaccines given', stats.vaccines_given],
    ['Vaccines overdue', stats.vaccines_overdue],
    ['Hospitals', stats.hospitals],
    ['Doctors', stats.doctors],
    ['Doctor logins', stats.doctor_logins],
    ['Records shared with doctors', stats.shares],
    ['Upcoming appointments', stats.upcoming_appointments],
    ['Screenings (30 days)', stats.screenings_month],
    ['High-risk screenings (30 days)', stats.screenings_high_month],
    ['Mood check-ins (7 days)', stats.mood_logs_week],
    ['Average mood (7 days)', stats.avg_mood_week ? stats.avg_mood_week + ' / 5' : '-'],
  ];

  return (
    <>
      <h2>Admin Dashboard</h2>
      <div className="grid tiles">
        {tiles.map(([label, value]) => (
          <div className="card tile" key={label}>
            <span className="muted">{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>

      <section className="card">
        <h3>New parents per month</h3>
        {stats.signups.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.signups}>
              <CartesianGrid stroke="#e8eaee" vertical={false} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip cursor={{ fill: 'rgba(214, 51, 108, .07)' }} />
              <Bar dataKey="count" name="Parents" fill="#d6336c" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="muted">No parents registered yet.</p>}
      </section>
      <p className="muted">Mood and screening data are shown only as totals. Individual entries stay private to each mother.</p>
    </>
  );
}
