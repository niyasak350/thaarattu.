import { useEffect, useState } from 'react';
import { api } from '../../api';

// One breathing round: in 4 seconds, hold 4, out 6
const STEPS = [
  { text: 'Breathe in', seconds: 4, size: 1 },
  { text: 'Hold', seconds: 4, size: 1 },
  { text: 'Breathe out', seconds: 6, size: 0.55 },
];

const TECHNIQUES = [
  ['Body scan', 'Lie down. Starting from your toes, notice each part of your body and let it soften, moving slowly up to your head.'],
  ['5-4-3-2-1 grounding', 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell and 1 you taste.'],
  ['Shoulder release', 'Lift your shoulders to your ears, hold for 5 seconds, then drop them. Repeat 5 times.'],
  ['Quiet minute', 'Sit with a warm drink for one minute without your phone. Just notice your breathing.'],
];

export default function RelaxTab() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [left, setLeft] = useState(STEPS[0].seconds);
  const [rounds, setRounds] = useState(0);
  const [quote, setQuote] = useState(0);
  const [affirmations, setAffirmations] = useState(['I am doing my best, and that is enough.']);
  useEffect(() => {
    api('/content/affirmations').then((list) => { if (list.length) setAffirmations(list.map((a) => a.text)); });
  }, []);

  // Count down every second while the exercise is running
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => {
      if (left > 1) { setLeft(left - 1); return; }
      const next = (step + 1) % STEPS.length;
      if (next === 0) setRounds(rounds + 1);
      setStep(next);
      setLeft(STEPS[next].seconds);
    }, 1000);
    return () => clearTimeout(timer);
  }, [running, left, step, rounds]);

  function toggle() {
    if (running) { setStep(0); setLeft(STEPS[0].seconds); }
    else setRounds(0);
    setRunning(!running);
  }

  const current = STEPS[step];
  const scale = running ? current.size : 0.55;

  return (
    <>
      <section className="card breathe">
        <h3>Guided breathing</h3>
        <div className="circle-box">
          <div className="circle" style={{ transform: `scale(${scale})`, transitionDuration: (running ? current.seconds : 1) + 's' }} />
          <div className="circle-text">
            {running ? <><b>{current.text}</b><span>{left}</span></> : <b>Ready?</b>}
          </div>
        </div>
        <button onClick={toggle}>{running ? 'Stop' : 'Start'}</button>
        <p className="muted">{rounds > 0 ? rounds + ' rounds done. ' : ''}Five rounds take about a minute.</p>
      </section>

      <section className="card affirm">
        <h3>Affirmation</h3>
        <p className="quote">{affirmations[quote % affirmations.length]}</p>
        <button className="small" onClick={() => setQuote(quote + 1)}>Next</button>
      </section>

      <section className="card">
        <h3>Relaxation techniques</h3>
        {TECHNIQUES.map(([title, text]) => (
          <p key={title}><b>{title}.</b> {text}</p>
        ))}
      </section>
    </>
  );
}
