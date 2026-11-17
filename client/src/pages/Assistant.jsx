import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useLang } from '../i18n';

const IDEAS = [
  'My baby is not sleeping well at night. What can I do?',
  'What foods can I start at 6 months?',
  'I feel very tired and low after delivery. Is this normal?',
];

export default function Assistant() {
  const { t } = useLang();
  const [messages, setMessages] = useState([]); // { role: 'user' | 'assistant', text }
  const [text, setText] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const bottom = useRef(null);

  // keep the newest message in view
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest' }); }, [messages, waiting]);

  async function send(question) {
    const q = question.trim();
    if (!q || waiting) return;
    const next = [...messages, { role: 'user', text: q }];
    setMessages(next);
    setText('');
    setError('');
    setWaiting(true);
    try {
      const data = await api('/assistant/chat', 'POST', { messages: next });
      setMessages([...next, { role: 'assistant', text: data.reply }]);
    } catch (err) {
      setError(err.message);
    }
    setWaiting(false);
  }

  return (
    <>
      <h2>{t('assistant')}</h2>
      <section className="card chat">
        <div className="chat-log">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p className="muted">Ask anything about child care or your own wellbeing. You can write in English or Malayalam.</p>
              {IDEAS.map((idea) => (
                <button key={idea} type="button" className="choice" onClick={() => send(idea)}>{idea}</button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={'bubble ' + m.role}>{m.text}</div>
          ))}
          {waiting && <div className="bubble assistant muted">Typing...</div>}
          <div ref={bottom} />
        </div>
        {error && <p className="error">{error}</p>}
        <form className="chat-form" onSubmit={(e) => { e.preventDefault(); send(text); }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your question..." maxLength="2000" />
          <button disabled={waiting || !text.trim()}>Send</button>
        </form>
      </section>
      <p className="muted">
        The assistant gives general guidance, not medical advice, and it can be wrong. For illness see a
        doctor. In an emergency call 112.
      </p>
    </>
  );
}
