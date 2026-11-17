import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { LangSwitch } from '../i18n';
import { ThemeToggle } from '../theme';
import PasswordInput from '../components/PasswordInput';
import { QUESTIONS } from './Register';
import { useLang } from '../i18n';

export default function Profile() {
  const { t } = useLang();
  const { user, setUser, logout } = useAuth();
  const [doctorOn, setDoctorOn] = useState(localStorage.getItem('doctorOff') !== '1');
  const toggleDoctor = () => {
    localStorage.setItem('doctorOff', doctorOn ? '1' : '0');
    setDoctorOn(!doctorOn);
  };
  const [name, setName] = useState(user.name);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [question, setQuestion] = useState(QUESTIONS[0]);
  const [answer, setAnswer] = useState('');
  const [checkPassword, setCheckPassword] = useState('');
  const [feedback, setFeedback] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function run(action, done) {
    setMessage(''); setError('');
    try { await action(); setMessage(done); } catch (err) { setError(err.message); }
  }

  const saveName = (e) => {
    e.preventDefault();
    run(async () => setUser((await api('/auth/profile', 'PUT', { name })).user), 'Name updated.');
  };
  const savePassword = (e) => {
    e.preventDefault();
    run(async () => {
      await api('/auth/password', 'PUT', { current, next });
      setCurrent(''); setNext('');
    }, 'Password changed.');
  };

  const saveSecurity = (e) => {
    e.preventDefault();
    run(async () => {
      await api('/auth/security', 'PUT', { current: checkPassword, security_question: question, security_answer: answer });
      setAnswer(''); setCheckPassword('');
    }, 'Security question updated.');
  };
  const sendFeedback = (e) => {
    e.preventDefault();
    run(async () => { await api('/mood/feedback', 'POST', { message: feedback }); setFeedback(''); }, 'Thank you. Your feedback was sent.');
  };

  return (
    <>
      <h2>{t('profile')}</h2>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <section className="card narrow">
        <h3>Preferences</h3>
        <div className="switch"><span>Language</span><LangSwitch /></div>
        <div className="switch"><span>Dark theme<small>Easier on the eyes at night</small></span><ThemeToggle /></div>
        {user.role !== 'admin' && (
          <label className="switch">
            <span>Doctor reminders<small>A doctor walks in on the home page to remind you</small></span>
            <input type="checkbox" className="auto" checked={doctorOn} onChange={toggleDoctor} style={{ width: 22, height: 22 }} />
          </label>
        )}
      </section>

      <form className="card narrow" onSubmit={saveName}>
        <h3>Account</h3>
        <label>Email<input value={user.email} disabled /></label>
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <button>Save name</button>
      </form>

      <form className="card narrow" onSubmit={savePassword}>
        <h3>Change password</h3>
        <label>Current password
          <PasswordInput value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </label>
        <label>New password (6+ characters)
          <PasswordInput minLength="6" value={next} onChange={(e) => setNext(e.target.value)} required />
        </label>
        <button>Change password</button>
      </form>

      <form className="card narrow" onSubmit={saveSecurity}>
        <h3>Security question</h3>
        <p className="muted">Used to reset your password if you forget it.</p>
        <label>Question
          <select value={question} onChange={(e) => setQuestion(e.target.value)}>
            {QUESTIONS.map((q) => <option key={q}>{q}</option>)}
          </select>
        </label>
        <label>Answer<input value={answer} onChange={(e) => setAnswer(e.target.value)} required /></label>
        <label>Current password
          <PasswordInput value={checkPassword} onChange={(e) => setCheckPassword(e.target.value)} required />
        </label>
        <button>Save security question</button>
      </form>

      {user.role !== 'admin' && (
        <form className="card narrow" onSubmit={sendFeedback}>
          <h3>Feedback to admin</h3>
          <textarea rows="3" maxLength="1000" value={feedback} onChange={(e) => setFeedback(e.target.value)} required />
          <button>Send</button>
        </form>
      )}
      <p><button className="danger" onClick={logout}>Log out</button></p>
    </>
  );
}
