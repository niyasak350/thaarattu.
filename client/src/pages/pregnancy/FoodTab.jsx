import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useLang } from '../../i18n';

export default function FoodTab({ trimester }) {
  const { t } = useLang();
  const [foods, setFoods] = useState([]);
  const [tri, setTri] = useState(trimester);
  useEffect(() => { api('/pregnancy/foods').then(setFoods); }, []);

  // trimester 0 means "whole pregnancy", so it is always shown
  const shown = foods.filter((f) => f.trimester === 0 || f.trimester === tri);
  const list = (kind) => shown.filter((f) => f.kind === kind).map((f) => (
    <div className="food" key={f.id}>
      <span className={kind === 'avoid' ? 'dot avoid' : 'dot'} />
      <span>
        <b>{f.title}</b>{f.details}
        {f.trimester !== 0 && <> <span className="badge">{t('trimester')} {f.trimester}</span></>}
      </span>
    </div>
  ));

  return (
    <>
      <div className="choices">
        {[1, 2, 3].map((n) => (
          <button key={n} type="button" className={tri === n ? 'choice on' : 'choice'} onClick={() => setTri(n)}>
            {t('trimester')} {n}
          </button>
        ))}
      </div>
      <div className="two">
        <section className="card"><h3>{t('eat')}</h3>{list('eat')}</section>
        <section className="card"><h3>{t('avoid')}</h3>{list('avoid')}</section>
      </div>
      <p className="muted">General suggestions only. If you have diabetes, high blood pressure, allergies or any other condition, follow the diet your doctor gives you.</p>
    </>
  );
}
