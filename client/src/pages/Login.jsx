import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useLang } from '../i18n';
import AuthShell from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';

// Who is logging in. (The site admin can use any of the three.)
const ROLES = [['parent', 'roleParent'], ['doctor', 'roleDoctor'], ['hospital_admin', 'roleHospital']];

export default function Login() {
  const { saveLogin } = useAuth();
  const { t } = useLang();
  const [role, setRole] = useState('parent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      saveLogin(await api('/auth/login', 'POST', { email, password, role }));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell title={t('welcomeBack')} subtitle={t('loginSub')}>
      <form onSubmit={submit}>
        <p className="label">{t('iAm')}</p>
        <div className="roles">
          {ROLES.map(([value, key]) => (
            <button type="button" key={value} className={role === value ? 'on' : ''} onClick={() => setRole(value)}>{t(key)}</button>
          ))}
        </div>
        {error && <p className="error">{error}</p>}
        <label>{t('email')}
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>{t('password')}
          <PasswordInput autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {role === 'parent' && <p className="right"><Link to="/forgot">{t('forgot')}</Link></p>}
        <button className="wide" disabled={busy}>{t('login')}</button>
      </form>
      {role === 'parent'
        ? <p className="muted center-text">{t('newHere')} <Link to="/register">{t('register')}</Link></p>
        : <p className="muted center-text">Doctor and hospital logins are given by the hospital or the site admin.</p>}
    </AuthShell>
  );
}
