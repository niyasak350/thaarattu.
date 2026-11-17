import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, formatDate, today } from '../../api';
import SupportNote from '../../components/SupportNote';

// Questions written for this project. This is NOT a validated clinical scale.
// To use a standard scale such as the EPDS, replace this list (and credit its authors).
const QUESTIONS = [
  'I found it hard to enjoy things I usually like.',
  'I felt sad or tearful.',
  'I felt anxious or worried without a clear reason.',
  'I blamed myself when things went wrong.',
  'I felt overwhelmed by everyday tasks.',
  'I had trouble sleeping even when my baby was asleep.',
  'I felt distant from my baby or my family.',
  'I felt scared or panicky.',
  'I felt hopeless about the future.',
  'I had thoughts of harming myself.',
];
const OPTIONS = ['Not at all', 'Some days', 'Most days', 'Almost every day']; // 0 to 3 points

// Score bands used by this app (0-30)
function level(score) {
  if (score >= 15) return { text: 'High', badge: 'badge late' };
  if (score >= 10) return { text: 'Moderate', badge: 'badge warn' };
  return { text: 'Low', badge: 'badge ok' };
}

export default function ScreeningTab() {
  const [history, setHistory] = useState([]);
  const [answers, setAnswers] = useState(Array(10).fill(null));
  const [result, setResult] = useState(null); // { score, selfHarm }
  const [error, setError] = useState('');

  const load = () => api('/wellness/screenings').then(setHistory);
  useEffect(() => { load(); }, []);

  function pick(question, points) {
    const next = [...answers];
    next[question] = points;
    setAnswers(next);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (answers.includes(null)) { setError('Please answer all 10 questions.'); return; }
    try {
      const data = await api('/wellness/screenings', 'POST', { answers });
      setResult({ score: data.score, selfHarm: answers[9] > 0 });
      setAnswers(Array(10).fill(null));
      load();
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.message);
    }
  }

  const last = history[history.length - 1];
  const daysSince = last ? Math.round((new Date(today()) - new Date(last.taken_on)) / 86400000) : null;
  const chartData = history.map((h) => ({ date: formatDate(h.taken_on), Score: h.score }));

  return (
    <>
      {result && (
        <>
          <div className="card">
            <h3>Your result</h3>
            <p className="score">{result.score} <span className="muted">out of 30</span> <span className={level(result.score).badge}>{level(result.score).text} risk</span></p>
            <p className="muted">This is a self-check, not a diagnosis. Only a doctor can diagnose postpartum depression.</p>
          </div>
          {result.selfHarm && (
            <SupportNote>
              <b>You said you have had thoughts of harming yourself.</b> You are not alone, and help is
              available right now.
            </SupportNote>
          )}
          {!result.selfHarm && result.score >= 10 && (
            <SupportNote>
              <b>Your answers suggest you are going through a difficult time.</b> Many new mothers feel
              this way, and support really helps.
            </SupportNote>
          )}
        </>
      )}

      <form className="card" onSubmit={submit}>
        <h3>Weekly wellbeing screening</h3>
        <p className="muted">
          {daysSince == null && 'Take this short check once a week. '}
          {daysSince != null && daysSince < 7 && `Last taken ${daysSince === 0 ? 'today' : daysSince + ' days ago'}. Next check is due in ${7 - daysSince} days. `}
          {daysSince != null && daysSince >= 7 && 'Your weekly check is due. '}
          Think about the last 7 days. Only your total score is saved, not your answers.
        </p>
        {QUESTIONS.map((q, i) => (
          <div key={q} className="question">
            <p className="label">{i + 1}. {q}</p>
            <div className="choices">
              {OPTIONS.map((text, points) => (
                <button type="button" key={text} className={answers[i] === points ? 'choice on' : 'choice'}
                  onClick={() => pick(i, points)}>{text}</button>
              ))}
            </div>
          </div>
        ))}
        {error && <p className="error">{error}</p>}
        <button>See my result</button>
      </form>

      {history.length > 0 && (
        <section className="card">
          <h3>Score history</h3>
          {chartData.length > 1 && (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#e8eaee" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis domain={[0, 30]} fontSize={12} />
                <Tooltip />
                <ReferenceLine y={10} stroke="#b54708" strokeDasharray="4 4" />
                <ReferenceLine y={15} stroke="#b42335" strokeDasharray="4 4" />
                <Line dataKey="Score" stroke="#5b77c7" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
          <table>
            <thead><tr><th>Date</th><th>Score</th><th>Risk</th></tr></thead>
            <tbody>
              {[...history].reverse().map((h) => (
                <tr key={h.id}>
                  <td>{formatDate(h.taken_on)}</td>
                  <td>{h.score} / 30</td>
                  <td><span className={level(h.score).badge}>{level(h.score).text}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
