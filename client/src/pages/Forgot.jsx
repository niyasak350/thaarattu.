import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useLang } from '../i18n';
import AuthShell from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';

// Step 1: enter email -> we show the security question.  Step 2: answer + new password.
export default function Forgot() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function findQuestion(e) {
    e.preventDefault();
    setError('');
    try {
      setQuestion((await api('/auth/forgot/question', 'POST', { email })).question);
    } catch (err) {
      setError(err.message);
    }
  }

  async function reset(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/auth/forgot/reset', 'POST', { email, answer, password });
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthShell title={t('resetPassword')} subtitle="Answer your security question to set a new password.">
      {error && <p className="error">{error}</p>}
      {done ? (
        <>
          <p className="success">Your password has been changed.</p>
          <Link to="/login" className="btn wide">{t('login')}</Link>
        </>
      ) : !question ? (
        <form onSubmit={findQuestion}>
          <label>{t('email')}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <button className="wide">Continue</button>
        </form>
      ) : (
        <form onSubmit={reset}>
          <p className="label">{question}</p>
          <label>{t('securityAnswer')}
            <input value={answer} onChange={(e) => setAnswer(e.target.value)} required />
          </label>
          <label>New password (6+ characters)
            <PasswordInput minLength="6" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="wide">{t('resetPassword')}</button>
        </form>
      )}
      <p className="muted center-text"><Link to="/login">&larr; {t('login')}</Link></p>
    </AuthShell>
  );
}
