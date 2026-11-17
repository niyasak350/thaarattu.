import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Baby, Moon, ShieldAlert, Smile, Utensils } from 'lucide-react';
import { api } from '../api';
import { useLang } from '../i18n';

const AGES = [
  ['0-5 months', 0, 5], ['6-8 months', 6, 8], ['9-11 months', 9, 11], ['1-2 years', 12, 23], ['2-5 years', 24, 60],
];
const ICONS = { feeding: Utensils, care: Baby, sleep: Moon, development: Smile, safety: ShieldAlert };

// embedded: shown as a tab inside the Baby page, so it does not repeat the page title
export default function BabyGuide({ embedded }) {
  const { t } = useLang();
  const [guides, setGuides] = useState([]);
  const [children, setChildren] = useState([]);
  const [age, setAge] = useState(0);         // index in AGES
  const [category, setCategory] = useState('all');

  useEffect(() => {
    api('/content/baby-guides').then(setGuides);
    // start on the age group of the youngest child, if there is one
    api('/children').then((list) => {
      setChildren(list);
      if (!list.length) return;
      const months = (Date.now() - new Date(list[0].dob)) / (1000 * 60 * 60 * 24 * 30.4375);
      const index = AGES.findIndex(([, from, to]) => months >= from && months < to + 1);
      if (index >= 0) setAge(index);
    });
  }, []);

  const [, from, to] = AGES[age];
  // a guide is shown when its month range overlaps the chosen age group
  const shown = guides.filter((g) => g.month_from <= to && g.month_to >= from &&
    (category === 'all' || g.category === category));

  return (
    <>
      {!embedded && <h2>{t('babyGuide')}</h2>}
      <p className="muted">How to care for your baby and what to feed, month by month.</p>

      <p className="label">Baby's age</p>
      <div className="choices">
        {AGES.map(([label], i) => (
          <button key={label} type="button" className={age === i ? 'choice on' : 'choice'} onClick={() => setAge(i)}>{label}</button>
        ))}
      </div>
      <p className="label">Topic</p>
      <div className="choices">
        {['all', ...Object.keys(ICONS)].map((c) => (
          <button key={c} type="button" className={category === c ? 'choice on' : 'choice'} onClick={() => setCategory(c)}
            style={{ textTransform: 'capitalize' }}>{c}</button>
        ))}
      </div>

      {shown.length === 0 && <p className="muted">No guides for this age and topic yet.</p>}
      <div className="guide">
        {shown.map((g) => {
          const Icon = ICONS[g.category];
          return (
            <div className="card" key={g.id}>
              <span className="cat"><Icon size={14} /> {g.category}</span>
              <h3>{g.title}</h3>
              <p>{g.content}</p>
            </div>
          );
        })}
      </div>

      {children.length > 0 && (
        <p style={{ marginTop: 20 }}>
          For meal ideas with recipes and allergy alerts, open your child's{' '}
          <Link to={'/child/' + children[0].id}>Nutrition tab</Link>.
        </p>
      )}
      <p className="muted" style={{ marginTop: 12 }}>General information only. Ask your pediatrician about your own baby.</p>
    </>
  );
}
