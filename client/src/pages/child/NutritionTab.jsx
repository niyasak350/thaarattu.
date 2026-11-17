import { useEffect, useState } from 'react';
import { api, ageText } from '../../api';

// "Milk, Egg " -> ['milk', 'egg']
const toList = (text) => (text || '').toLowerCase().split(',').map((t) => t.trim()).filter(Boolean);

const TIPS = [
  'Introduce one new food at a time and wait 3 days before the next.',
  'No honey before 1 year. No whole nuts or hard pieces before 5 years (choking risk).',
  'Avoid added salt and sugar in the first year.',
  'Offer water in a cup with meals after 6 months.',
];

export default function NutritionTab({ child, onChildChange }) {
  const [meals, setMeals] = useState([]);
  const [allergies, setAllergies] = useState(child.allergies || '');
  const [saved, setSaved] = useState(false);
  useEffect(() => { api('/children/' + child.id + '/meals').then(setMeals); }, [child.id]);

  async function saveAllergies(e) {
    e.preventDefault();
    await api('/children/' + child.id, 'PUT', { allergies });
    onChildChange({ ...child, allergies });
    setSaved(true);
  }

  const childAllergies = toList(child.allergies);
  // allergens of a meal that match this child's allergies
  const alerts = (meal) => toList(meal.allergens).filter((a) => childAllergies.includes(a));

  return (
    <section className="card">
      <h3>Nutrition Planner <span className="muted">· meal ideas for {ageText(child.dob)} old</span></h3>

      <form onSubmit={saveAllergies} className="inline">
        <label>Allergies (comma separated: milk, egg, nuts, wheat, fish)
          <input value={allergies} onChange={(e) => { setAllergies(e.target.value); setSaved(false); }} placeholder="none" />
        </label>
        <button className="small">Save</button>
        {saved && <span className="muted">Saved</span>}
      </form>

      {meals.length === 0 && <p className="muted">No meal ideas for this age yet.</p>}
      <div className="grid">
        {meals.map((m) => (
          <div key={m.id} className={alerts(m).length ? 'meal warn' : 'meal'}>
            <span className="badge">{m.meal_type}</span>
            <b>{m.title}</b>
            <p>{m.recipe}</p>
            {alerts(m).length > 0 && (
              <p className="error">Allergy alert: contains {alerts(m).join(', ')}</p>
            )}
            {m.allergens && alerts(m).length === 0 && <span className="muted">Contains: {m.allergens}</span>}
          </div>
        ))}
      </div>

      <p className="label">Nutrition tips</p>
      <ul>{TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
      <p className="muted">General guidance only. Follow your pediatrician's advice for your child.</p>
    </section>
  );
}
