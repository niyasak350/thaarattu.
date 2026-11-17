import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, ageText, formatDate, today } from '../api';
import { useLang } from '../i18n';
import Tabs from '../components/Tabs';
import BabyGuide from './BabyGuide';
import AddToggle from '../components/AddToggle';

const empty = { name: '', dob: '', gender: 'female', blood_group: '', allergies: '' };

export default function Children() {
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const showGuide = params.get('tab') === 'guide';
  const labels = [t('myChildren'), t('careGuide')];
  const [children, setChildren] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const load = () => api('/children').then(setChildren).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function addChild(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/children', 'POST', form);
      setForm(empty);
      setAdding(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h2>{t('myBaby')}</h2>
      <Tabs tabs={labels} active={labels[showGuide ? 1 : 0]} onChange={(label) => setParams(label === labels[1] ? { tab: 'guide' } : {})} />
      {showGuide ? <BabyGuide embedded /> : (
      <>
      {children.length === 0 && <p className="muted">No child added yet. Add your baby below to get the growth tracker, vaccination schedule, meal ideas and health records.</p>}
      <div className="grid">
        {children.map((c) => (
          <Link key={c.id} to={'/child/' + c.id} className="card child">
            <span className="avatar">{c.name[0].toUpperCase()}</span>
            <span>
              <b>{c.name}</b><br />
              <span className="muted">{ageText(c.dob)} old · born {formatDate(c.dob)}</span><br />
              <span className="muted">Growth · Vaccines · Food · Health · Photos</span>
            </span>
          </Link>
        ))}
      </div>

      {/* with no baby yet the form is shown straight away; otherwise only after pressing the button */}
      <AddToggle label={t('addChild')} open={adding || children.length === 0} onOpen={() => setAdding(true)}>
      <form className="card" onSubmit={addChild}>
        <h3>{t('addChild')}</h3>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <label>Name
            <input name="name" value={form.name} onChange={change} required />
          </label>
          <label>Date of birth
            <input name="dob" type="date" max={today()} value={form.dob} onChange={change} required />
          </label>
          <label>Gender
            <select name="gender" value={form.gender} onChange={change}>
              <option value="female">Girl</option>
              <option value="male">Boy</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Blood group
            <input name="blood_group" value={form.blood_group} onChange={change} placeholder="optional" maxLength="5" />
          </label>
          <label>Allergies
            <input name="allergies" value={form.allergies} onChange={change} placeholder="e.g. milk, egg" />
          </label>
        </div>
        <button>{t('save')}</button>{' '}
        {children.length > 0 && <button type="button" className="ghost" onClick={() => setAdding(false)}>Cancel</button>}
        <p className="muted">The vaccination schedule is created automatically from the date of birth.</p>
      </form>
      </AddToggle>
      </>
      )}
    </>
  );
}
