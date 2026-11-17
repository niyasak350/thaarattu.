import { Link } from 'react-router-dom';
import { useSettings } from '../SettingsContext';
import { LangSwitch } from '../i18n';
import { ThemeToggle } from '../theme';
import Logo from './Logo';

// Frame used by the login, register and forgot-password pages
export default function AuthShell({ title, subtitle, children }) {
  const { app_name } = useSettings();
  return (
    <div className="auth-page">
      <div className="auth-top">
        <Link to="/" className="brand"><Logo /> <span>{app_name}</span></Link>
        <span><LangSwitch /><ThemeToggle /></span>
      </div>
      <div className="auth-box">
        <div className="auth-inner">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
