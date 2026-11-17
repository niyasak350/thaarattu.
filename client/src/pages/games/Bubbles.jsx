import { useEffect, useRef, useState } from 'react';

// Bubbles float up the screen; tap to pop them. One round lasts 45 seconds.
const ROUND = 45;

export default function Bubbles() {
  const [playing, setPlaying] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(ROUND);
  const nextId = useRef(0);

  useEffect(() => {
    if (!playing) return;
    // a new bubble every 0.6 seconds, at a random place, size and speed
    const maker = setInterval(() => {
      const size = 44 + Math.random() * 46;
      setBubbles((list) => [...list, {
        id: nextId.current++, size, left: Math.random() * 86, seconds: 5 + Math.random() * 4,
      }]);
    }, 600);
    const timer = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => { clearInterval(maker); clearInterval(timer); };
  }, [playing]);

  useEffect(() => { if (left <= 0) setPlaying(false); }, [left]);

  function start() {
    setBubbles([]); setScore(0); setLeft(ROUND); setPlaying(true);
  }
  const remove = (id) => setBubbles((list) => list.filter((b) => b.id !== id));
  function pop(id) {
    remove(id);
    setScore((s) => s + 1);
  }

  return (
    <section className="card">
      <div className="game-bar">
        <span>Popped <b>{score}</b></span>
        <span>Time <b>{Math.max(0, left)}s</b></span>
      </div>
      <div className="sky">
        {playing && bubbles.map((b) => (
          <button key={b.id} type="button" className="pop-bubble" aria-label="Bubble"
            style={{ left: b.left + '%', width: b.size, height: b.size, animationDuration: b.seconds + 's' }}
            onPointerDown={() => pop(b.id)} onAnimationEnd={() => remove(b.id)} />
        ))}
        {!playing && (
          <div className="sky-msg">
            {left <= 0 ? <b>You popped {score} bubbles. Take a slow, deep breath.</b> : <b>Pop the bubbles as they float up.</b>}
            <div><button onClick={start}>{left <= 0 ? 'Play again' : 'Start'}</button></div>
          </div>
        )}
      </div>
    </section>
  );
}
