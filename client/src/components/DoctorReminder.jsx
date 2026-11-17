import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// A doctor walks in from the side of the screen and reads out the reminders one by one.
// messages: list of sentences.  onClose: called when she has left.
export default function DoctorReminder({ messages, onClose }) {
  const [stage, setStage] = useState('start'); // start -> walking -> talking -> leaving
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // start walking just after she is placed off-screen, then stop and talk
    const begin = setTimeout(() => setStage('walking'), 60);
    const arrive = setTimeout(() => setStage('talking'), 2500);
    return () => { clearTimeout(begin); clearTimeout(arrive); };
  }, []);

  function leave() {
    setStage('leaving');
    setTimeout(onClose, 1600);
  }
  const last = index + 1 >= messages.length;

  const position = stage === 'start' ? '' : stage === 'leaving' ? ' out walking' : ' in';
  const motion = stage === 'walking' ? ' walking' : stage === 'talking' ? ' talking' : '';

  // drawn on the page body so she stays at the bottom of the screen while the page scrolls
  return createPortal(
    <div className={'doctor' + position + motion} role="status">
      <DoctorPicture />
      {stage === 'talking' && (
        <div className="speech">
          <header><b>Reminder</b><small>{index + 1} of {messages.length}</small></header>
          {messages.length > 1 && (
            <div className="dots">{messages.map((m, i) => <i key={i} className={i <= index ? 'on' : ''} />)}</div>
          )}
          <p>{messages[index]}</p>
          <div>
            <button className="small" onClick={() => (last ? leave() : setIndex(index + 1))}>{last ? 'Thank you, doctor' : 'Next'}</button>
            {!last && <button className="small ghost" onClick={leave}>Close</button>}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

// The doctor, drawn with simple shapes so her legs and arms can be animated in styles.css.
// Her shirt and stethoscope use the theme colour.
function DoctorPicture() {
  const line = { stroke: '#2b2f36', strokeWidth: 1.4, strokeLinejoin: 'round', strokeLinecap: 'round' };
  const accent = { fill: 'var(--primary)' };
  return (
    <svg viewBox="0 0 120 214" aria-hidden="true">
      <ellipse cx="60" cy="208" rx="34" ry="5" fill="rgba(0,0,0,.14)" />
      {/* legs */}
      <g className="leg a" {...line}><rect x="45" y="138" width="12" height="58" rx="5" fill="#2b2f36" /><path d="M43 196h17a4 4 0 0 1 4 4v3H43z" fill="#111317" /></g>
      <g className="leg b" {...line}><rect x="63" y="138" width="12" height="58" rx="5" fill="#2b2f36" /><path d="M61 196h17a4 4 0 0 1 4 4v3H61z" fill="#111317" /></g>
      <g className="body">
        {/* back arm */}
        <g className="arm" {...line}><rect x="27" y="76" width="12" height="50" rx="6" fill="#fff" /><circle cx="33" cy="128" r="6" fill="#e8b996" /></g>
        {/* coat */}
        <path d="M37 78q23-12 46 0l5 66H32z" fill="#fff" {...line} />
        <path d="M52 73l8 16 8-16" style={accent} {...line} />
        <path d="M60 89v55" {...line} fill="none" />
        <rect x="68" y="112" width="13" height="11" rx="2" fill="#f1f2f5" {...line} />
        {/* stethoscope */}
        <path d="M49 76q-4 22 5 30M71 76q5 14 0 22" fill="none" style={{ stroke: 'var(--primary)' }} strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="55" cy="108" r="4.200" style={accent} {...line} />
        {/* front arm: waves while talking */}
        <g className="arm wave" {...line}><rect x="81" y="76" width="12" height="50" rx="6" fill="#fff" /><circle cx="87" cy="128" r="6" fill="#e8b996" /></g>
        {/* head */}
        <rect x="54" y="62" width="12" height="14" fill="#e8b996" {...line} />
        <circle cx="79" cy="30" r="9" fill="#3a2a26" {...line} />
        <circle cx="60" cy="46" r="21" fill="#f0c7a6" {...line} />
        <path d="M39 46q-2-25 21-25 23 0 21 25-6-14-21-14T39 46z" fill="#3a2a26" {...line} />
        <circle cx="52" cy="48" r="1.900" fill="#2b2f36" /><circle cx="68" cy="48" r="1.900" fill="#2b2f36" />
        <path d="M53 56q7 6 14 0" fill="none" {...line} />
      </g>
    </svg>
  );
}
