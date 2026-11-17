import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useLang } from '../i18n';
import AuthShell from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';

export const QUESTIONS = [
  'What is your mother\'s first name?',
  'What was the name of your first school?',
  'What is your favourite food?',
  'In which town were you born?',
];

export default function Register() {
  const { saveLogin } = useAuth();
  const { t } = useLang();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', security_question: QUESTIONS[0], security_answer: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('The two passwords do not match.'); return; }
    setBusy(true);
    try {
      saveLogin(await api('/auth/register', 'POST', form));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell title={t('register')} subtitle={t('registerSub')}>
      <form onSubmit={submit}>
        {error && <p className="error">{error}</p>}
        <label>{t('yourName')}
          <input name="name" autoComplete="name" value={form.name} onChange={change} required />
        </label>
        <label>{t('email')}
          <input name="email" type="email" autoComplete="email" value={form.email} onChange={change} required />
        </label>
        <div className="row">
          <label>{t('password')}
            <PasswordInput name="password" autoComplete="new-password" minLength="6" value={form.password} onChange={change} required />
          </label>
          <label>{t('confirmPassword')}
            <PasswordInput name="confirm" autoComplete="new-password" minLength="6" value={form.confirm} onChange={change} required />
          </label>
        </div>
        <label>{t('securityQuestion')}
          <select name="security_question" value={form.security_question} onChange={change}>
            {QUESTIONS.map((q) => <option key={q}>{q}</option>)}
          </select>
        </label>
        <label>{t('securityAnswer')}
          <input name="security_answer" value={form.security_answer} onChange={change} required />
        </label>
        <p className="muted">The security answer lets you reset your password if you forget it.</p>
        <button className="wide" disabled={busy}>{t('register')}</button>
      </form>
      <p className="muted center-text">{t('haveAccount')} <Link to="/login">{t('login')}</Link></p>
    </AuthShell>
  );
}
