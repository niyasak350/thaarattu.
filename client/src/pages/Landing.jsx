import { Link } from 'react-router-dom';
import { useSettings } from '../SettingsContext';
import { LangSwitch, useLang } from '../i18n';
import { ThemeToggle } from '../theme';
import Logo from '../components/Logo';
import Scenes from '../components/Scenes';
import MotherBaby from '../components/MotherBaby';

// First page for visitors who are not logged in: one line, two buttons, one picture.
export default function Landing() {
  const { app_name, tagline, hero_image } = useSettings();
  const { t } = useLang();
  // the last two words of the tagline are shown in the accent colour
  const words = tagline.trim().split(/\s+/);
  const start = words.slice(0, -2).join(' ');
  const end = words.slice(-2).join(' ');
  return (
    <div className="landing">
      <header className="land-top">
        <span className="brand"><Logo /> <span>{app_name}</span></span>
        <span className="land-actions">
          <LangSwitch /><ThemeToggle />
          <Link to="/login" className="btn small dark">{t('login')}</Link>
        </span>
      </header>

      <section className="hero">
        <div>
          <h1>{start} <span>{end}</span></h1>
          <p>{t('landingText')}</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn big">{t('getStarted')}</Link>
            <Link to="/login" className="btn big ghost">{t('login')}</Link>
          </div>
        </div>
        {/* the mother and baby picture, or the admin's own photo if one is uploaded */}
        <div className={hero_image ? 'hero-pic photo' : 'hero-pic'}>
          {hero_image ? <img src={hero_image} alt="" /> : <MotherBaby />}
        </div>
      </section>

      <Scenes />

      <footer className="land-foot">
        {app_name} gives general information, not medical advice.
        {' · '}<Link to="/creators">{t('creators')}</Link>
      </footer>
    </div>
  );
}
