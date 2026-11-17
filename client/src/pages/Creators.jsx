import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Mail, Phone } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { LangSwitch, useLang } from '../i18n';
import { ThemeToggle } from '../theme';
import Logo from '../components/Logo';

// The people who made the site. Anyone can open this page, logged in or not.
// The admin manages the list under Admin > Creators.
export default function Creators() {
  const { user } = useAuth();
  const { app_name, creators_note } = useSettings();
  const { t } = useLang();
  const [people, setPeople] = useState(null);
  useEffect(() => { fetch('/api/creators').then((res) => res.json()).then(setPeople).catch(() => setPeople([])); }, []);

  const content = (
    <>
      <div className="creators-head">
        <span className="eyebrow">{t('creators')}</span>
        <h2>The people behind {app_name}</h2>
        {creators_note && <p className="muted">{creators_note}</p>}
      </div>
      {people && people.length === 0 && <p className="center">No creators added yet.</p>}
      <div className="creators">
        {people && people.map((p) => (
          <article className="card creator" key={p.id}>
            {p.photo
              ? <img src={p.photo} alt={p.name} />
              : <span className="avatar big">{p.name[0].toUpperCase()}</span>}
            <h3>{p.name}</h3>
            {p.role && <span className="badge">{p.role}</span>}
            {p.about && <p>{p.about}</p>}
            {p.details && <p className="muted">{p.details}</p>}
            <div className="contacts">
              {p.email && <a href={'mailto:' + p.email}><Mail size={16} /> {p.email}</a>}
              {p.phone && <a href={'tel:' + p.phone}><Phone size={16} /> {p.phone}</a>}
              {p.link && <a href={p.link} target="_blank" rel="noreferrer"><Link2 size={16} /> {p.link.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a>}
            </div>
          </article>
        ))}
      </div>
    </>
  );

  // Logged-in users see it inside the normal menu layout (App.jsx wraps it)
  if (user) return content;

  return (
    <div className="landing">
      <header className="land-top">
        <Link to="/" className="brand"><Logo /> <span>{app_name}</span></Link>
        <span className="land-actions">
          <LangSwitch /><ThemeToggle />
          <Link to="/login" className="btn small">{t('login')}</Link>
        </span>
      </header>
      <main>{content}</main>
    </div>
  );
}
