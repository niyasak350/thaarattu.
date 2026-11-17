import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Baby, Heart, Lightbulb } from 'lucide-react';
import { api, formatDate } from '../../api';
import { useLang } from '../../i18n';
import Ring from '../../components/Ring';
import PregnancySetup from './Setup';

export default function OverviewTab({ pregnancy, reload }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [guides, setGuides] = useState([]);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { api('/pregnancy/guides').then(setGuides); }, []);

  async function babyBorn() {
    if (!confirm('Congratulations! Close the pregnancy tracker and add your baby?')) return;
    await api('/pregnancy/complete', 'POST');
    navigate('/children');
  }

  if (editing) return <PregnancySetup onSaved={() => { setEditing(false); reload(); }} onCancel={() => setEditing(false)} />;

  const g = pregnancy.guide;
  return (
    <>
      <section className="card week-hero">
        <Ring percent={pregnancy.progress}>
          <small>{t('week')}</small><b>{pregnancy.week}</b>
        </Ring>
        <div className="grow">
          <h3>{g ? g.title : 'Your pregnancy'}</h3>
          <div className="facts">
            <span><span className="muted">Today</span><b>{t('week')} {pregnancy.week}, day {pregnancy.day_of_week + 1}</b></span>
            <span><span className="muted">{t('trimester')}</span><b>{pregnancy.trimester}</b></span>
            <span><span className="muted">{t('dueDate')}</span><b>{formatDate(pregnancy.due_date)}</b></span>
            <span><span className="muted">{t('daysToGo')}</span><b>{Math.max(0, pregnancy.days_left)}</b></span>
          </div>
          <button className="small ghost" onClick={() => setEditing(true)}>Change dates</button>{' '}
          <button className="small" onClick={babyBorn}>My baby is born</button>
        </div>
      </section>

      {g && (
        <section className="card">
          <h3>This week: weeks {g.week_from} to {g.week_to}</h3>
          <div className="guide-cards">
            <div><b><Baby size={18} /> Your baby</b>{g.baby}</div>
            <div><b><Heart size={18} /> Your body</b>{g.mother}</div>
            <div><b><Lightbulb size={18} /> Tips</b>{g.tips}</div>
          </div>
          <p className="muted">General information only. Every pregnancy is different, so follow your doctor's advice.</p>
        </section>
      )}

      <section className="card">
        <div className="title-row">
          <h3>Week-by-week guide</h3>
          <button className="small ghost" onClick={() => setShowAll(!showAll)}>{showAll ? 'Hide' : 'Show all weeks'}</button>
        </div>
        {showAll && guides.map((x) => (
          <div className="entry" key={x.id}>
            <b>Weeks {x.week_from} to {x.week_to}: {x.title}</b>
            <p><b>Baby:</b> {x.baby}</p>
            <p><b>You:</b> {x.mother}</p>
            <p><b>Tips:</b> {x.tips}</p>
          </div>
        ))}
      </section>
    </>
  );
}
