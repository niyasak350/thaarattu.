import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Baby, Bell, BookOpen, CalendarCheck, ClipboardList, Flower2, Gamepad2, HeartPulse, Sparkles, Stethoscope, Video } from 'lucide-react';
import { api, formatDate, today } from '../api';
import { useAuth } from '../AuthContext';
import { useLang } from '../i18n';
import Ring from '../components/Ring';
import DoctorReminder from '../components/DoctorReminder';

// Turns the reminders from the server into sentences for the doctor to say
function doctorMessages(reminders, pregnancy) {
  const list = [];
  for (const c of reminders.checkups) {
    const where = (c.checkup_time ? ' at ' + c.checkup_time : '') + (c.place ? ', ' + c.place : '');
    if (c.overdue) list.push(`You missed "${c.title}" on ${formatDate(c.checkup_date)}. Please fix a new date soon.`);
    else if (c.checkup_date === today()) list.push(`Today is your "${c.title}"${where}. Take your earlier reports with you.`);
    else list.push(`Your "${c.title}" is on ${formatDate(c.checkup_date)}${where}.`);
  }
  for (const a of reminders.appointments) {
    list.push(`You have an appointment with ${a.doctor} on ${formatDate(a.appt_date)} at ${a.time_slot}${a.child ? ' for ' + a.child : ''}.`);
  }
  // vaccines: one sentence for each child
  const byChild = {};
  for (const v of reminders.vaccines) (byChild[v.child] = byChild[v.child] || []).push(v);
  for (const [child, items] of Object.entries(byChild)) {
    const late = items.filter((v) => v.overdue);
    if (late.length) list.push(`${child} has ${late.length} vaccine${late.length > 1 ? 's' : ''} overdue, starting with ${late[0].vaccine}. Please visit the clinic.`);
    const soon = items.find((v) => !v.overdue);
    if (soon) list.push(`${child}'s ${soon.vaccine} vaccine is due on ${formatDate(soon.due_date)}.`);
  }
  if (pregnancy) list.push(`You are in week ${pregnancy.week}. Remember your tablets, plenty of water and some rest today.`);
  return list;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLang();
  const [pregnancy, setPregnancy] = useState(undefined); // undefined = still loading
  const [children, setChildren] = useState([]);
  const [reminders, setReminders] = useState(null);
  const [thought, setThought] = useState('');
  const [doctor, setDoctor] = useState(false); // is the doctor on screen?

  useEffect(() => {
    api('/pregnancy').then(setPregnancy);
    api('/children').then(setChildren);
    api('/care/reminders').then(setReminders);
    // a different affirmation each day
    api('/content/affirmations').then((list) => {
      if (list.length) setThought(list[Math.floor(Date.now() / 86400000) % list.length].text);
    });
  }, []);

  const ready = reminders && pregnancy !== undefined;
  const messages = ready ? doctorMessages(reminders, pregnancy) : [];
  const count = reminders ? reminders.checkups.length + reminders.appointments.length + reminders.vaccines.length : 0;

  // The doctor walks in by herself when there is something to remind
  // (unless switched off in My Profile)
  useEffect(() => {
    if (ready && count > 0 && localStorage.getItem('doctorOff') !== '1') setDoctor(true);
  }, [ready]);

  const isNew = pregnancy === null && children.length === 0;
  const tiles = [
    ['/pregnancy', HeartPulse, t('pregnancy'), 'Week guide, food, check-ups'],
    ['/children', Baby, t('myBaby'), 'Growth, vaccines, health'],
    ['/children?tab=guide', BookOpen, t('babyGuide'), 'Feeding and care by month'],
    ['/wellness', Flower2, t('wellness'), 'Mood, rest, journal'],
    ['/games', Gamepad2, t('games'), 'Relax your mind'],
    ['/records', ClipboardList, t('healthRecord'), 'Day, week, month'],
    ['/hospitals', Stethoscope, t('doctors'), 'Find and book'],
    ['/appointments', CalendarCheck, t('appointments'), 'Your bookings'],
    ['/videos', Video, t('videos'), 'Watch and learn'],
    ['/assistant', Sparkles, t('assistant'), 'Ask any question'],
  ];

  return (
    <>
      <div className="hello">
        <span className="hand">{formatDate(today())}</span>
        <h2>{t('hi')}, {user.name}</h2>
      </div>

      {thought && (
        <section className="card thought">
          <small>{t('todaysThought')}</small>
          <p>{thought}</p>
        </section>
      )}

      {/* New user: choose where to start */}
      {isNew && (
        <div className="start">
          <Link to="/pregnancy"><HeartPulse size={28} /><b>I am pregnant</b><small>Track your weeks, food and check-ups.</small></Link>
          <Link to="/children" className="alt"><Baby size={28} /><b>My baby is born</b><small>Add your baby for growth, vaccines and care guides.</small></Link>
        </div>
      )}

      {pregnancy && (
        <section className="card preg-card">
          <Ring percent={pregnancy.progress}>
            <small>{t('week')}</small><b>{pregnancy.week}</b>
          </Ring>
          <div className="grow">
            <h3>{pregnancy.guide ? pregnancy.guide.title : t('pregnancy')}</h3>
            <div className="facts">
              <span><span className="muted">{t('dueDate')}</span><b>{formatDate(pregnancy.due_date)}</b></span>
              <span><span className="muted">{t('daysToGo')}</span><b>{Math.max(0, pregnancy.days_left)}</b></span>
            </div>
            <Link to="/pregnancy" className="btn small">{t('pregnancy')} &rarr;</Link>
          </div>
        </section>
      )}

      <section className="card">
        <div className="title-row">
          <h3><Bell size={18} style={{ verticalAlign: -3 }} /> {t('reminders')}</h3>
          {messages.length > 0 && !doctor && (
            <button className="small ghost" onClick={() => setDoctor(true)}>Call the doctor</button>
          )}
        </div>
        {count === 0 && <p className="muted">{t('noReminders')}</p>}
        <ul className="plain">
          {reminders && reminders.checkups.map((c) => (
            <li key={'c' + c.id}>
              <span className={c.overdue ? 'badge late' : 'badge warn'}>{c.overdue ? 'Check-up missed' : 'Check-up'}</span>{' '}
              <b>{c.title}</b> · {formatDate(c.checkup_date)}{c.checkup_time && ' at ' + c.checkup_time}
              {c.place && ', ' + c.place} · <Link to="/pregnancy?tab=checkups">Open</Link>
            </li>
          ))}
          {reminders && reminders.appointments.map((a) => (
            <li key={'a' + a.id}>
              <span className="badge">Appointment</span>{' '}
              {formatDate(a.appt_date)} at {a.time_slot} with <b>{a.doctor}</b>, {a.hospital}
              {a.child && <> (for {a.child})</>} · <Link to="/appointments">View</Link>
            </li>
          ))}
          {reminders && reminders.vaccines.slice(0, 3).map((v) => (
            <li key={'v' + v.id}>
              <span className={v.overdue ? 'badge late' : 'badge'}>{v.overdue ? 'Vaccine overdue' : 'Vaccine due'}</span>{' '}
              <b>{v.vaccine}</b> for {v.child} · {formatDate(v.due_date)} · <Link to={'/child/' + v.child_id}>Open</Link>
            </li>
          ))}
          {reminders && reminders.vaccines.length > 3 && (
            <li className="muted">and {reminders.vaccines.length - 3} more vaccine reminders in your child's Vaccination tab.</li>
          )}
        </ul>
      </section>

      <div className="home-tiles">
        {tiles.map(([to, Icon, title, text]) => (
          <Link key={to} to={to}>
            <span className="dot-icon"><Icon size={24} /></span>
            <span><b>{title}</b><small>{text}</small></span>
          </Link>
        ))}
      </div>

      {doctor && messages.length > 0 && <DoctorReminder messages={messages} onClose={() => setDoctor(false)} />}
    </>
  );
}
