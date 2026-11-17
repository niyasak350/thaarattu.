import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Baby, BookOpen, CalendarCheck, ClipboardList, Clock, Flower2, HeartPulse, Home, Image, LogOut, Menu, Siren,
  Stethoscope, X, LayoutDashboard, Users, Settings, Utensils, Syringe, Hospital, Star, MessageSquare,
  Quote, CircleHelp, Apple, Video,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { LangSwitch, useLang } from '../i18n';
import { ThemeToggle } from '../theme';
import Logo from './Logo';

// Menu for parents. "key" is looked up in i18n.jsx. The first 5 are also the phone's bottom bar.
const PARENT_MENU = [
  { to: '/', key: 'home', icon: Home },
  { to: '/pregnancy', key: 'pregnancy', icon: HeartPulse },
  { to: '/children', key: 'baby', icon: Baby },
  { to: '/wellness', key: 'wellnessShort', icon: Flower2 },
  { to: '/hospitals', key: 'doctorsShort', icon: Stethoscope },
  { to: '/records', key: 'records', icon: ClipboardList },
  { to: '/videos', key: 'videos', icon: Video },
];

// Side menus for the other kinds of account
const MENUS = {
  admin: {
    title: 'Site admin',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/settings', label: 'Site Settings', icon: Settings },
      { to: '/admin/site-photos', label: 'First Page Photos', icon: Image },
      { to: '/admin/creators', label: 'Creators', icon: Users },
      { to: '/admin/hospitals', label: 'Hospitals & Doctors', icon: Hospital },
      { to: '/admin/appointments', label: 'Appointments', icon: CalendarCheck },
      { to: '/admin/reviews', label: 'Reviews', icon: Star },
      { to: '/admin/pregnancy-guides', label: 'Pregnancy Guide', icon: HeartPulse },
      { to: '/admin/pregnancy-foods', label: 'Pregnancy Foods', icon: Apple },
      { to: '/admin/baby-guides', label: 'Baby Guide', icon: BookOpen },
      { to: '/admin/meals', label: 'Baby Meals', icon: Utensils },
      { to: '/admin/vaccines', label: 'Vaccines', icon: Syringe },
      { to: '/admin/videos', label: 'Videos', icon: Video },
      { to: '/admin/quiz', label: 'Quiz', icon: CircleHelp },
      { to: '/admin/affirmations', label: 'Affirmations', icon: Quote },
      { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
    ],
  },
  doctor: {
    title: 'Doctor',
    items: [
      { to: '/doctor', label: 'Appointments', icon: CalendarCheck },
      { to: '/doctor/patients', label: 'Patient Records', icon: ClipboardList },
      { to: '/doctor/timing', label: 'My Timing', icon: Clock },
    ],
  },
  hospital_admin: {
    title: 'Hospital admin',
    items: [
      { to: '/hospital', label: 'My Hospital', icon: Hospital },
      { to: '/hospital/doctors', label: 'Doctors', icon: Stethoscope },
      { to: '/hospital/appointments', label: 'Appointments', icon: CalendarCheck },
      { to: '/hospital/reviews', label: 'Reviews', icon: Star },
    ],
  },
};

export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  // go to the top whenever the page changes
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return user.role === 'parent' ? <ParentLayout>{children}</ParentLayout> : <SideLayout>{children}</SideLayout>;
}

// Parents: one simple bar on top (computer) and five big buttons at the bottom (phone)
function ParentLayout({ children }) {
  const { user, logout } = useAuth();
  const { app_name } = useSettings();
  const { t } = useLang();
  return (
    <div className="shell">
      <header className="head">
        <div className="head-row">
          <Link to="/" className="brand"><Logo /> <span>{app_name}</span></Link>
          <nav>
            {PARENT_MENU.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className="nav-link">{t(item.key)}</NavLink>
            ))}
          </nav>
          <div className="head-tools">
            <Link to="/emergency" className="sos"><Siren size={18} /><span>{t('emergency')}</span></Link>
            <LangSwitch />
            <ThemeToggle />
            <Link to="/profile" className="icon-btn" title={t('profile')} aria-label={t('profile')}>
              <b>{user.name[0].toUpperCase()}</b>
            </Link>
            <button className="icon-btn hide-phone" onClick={logout} title={t('logout')} aria-label={t('logout')}><LogOut size={19} /></button>
          </div>
        </div>
      </header>

      <main>{children}</main>
      <footer className="foot"><Link to="/creators">{t('creators')}</Link> · {app_name}</footer>

      <nav className="bottom">
        {PARENT_MENU.slice(0, 5).map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            <item.icon size={22} /><span>{t(item.key)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

// Admin, doctor and hospital admin: a side menu
function SideLayout({ children }) {
  const { user, logout } = useAuth();
  const { app_name } = useSettings();
  const location = useLocation();
  const [open, setOpen] = useState(false); // phone menu
  useEffect(() => { setOpen(false); }, [location.pathname]);
  const menu = MENUS[user.role];
  const home = menu.items[0].to;
  return (
    <div className="shell admin">
      <aside className={open ? 'side open' : 'side'}>
        <Link to={home} className="brand"><Logo size={34} /> <span>{app_name}</span></Link>
        <span className="who">{menu.title} · {user.name}</span>
        <nav>
          {menu.items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === home} className="nav-link">
              <item.icon size={19} /><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <ThemeToggle />
          <Link to="/profile" className="icon-btn" title="My profile" aria-label="My profile"><b>{user.name[0].toUpperCase()}</b></Link>
          <button className="icon-btn" onClick={logout} title="Log out" aria-label="Log out"><LogOut size={19} /></button>
        </div>
      </aside>
      {open && <div className="shade" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="admin-top">
          <Link to={home} className="brand"><Logo size={32} /> <span>{app_name}</span></Link>
          <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={21} /> : <Menu size={21} />}</button>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
