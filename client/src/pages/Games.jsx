import { useState } from 'react';
import { useLang } from '../i18n';
import Tabs from '../components/Tabs';
import Memory from './games/Memory';
import Bubbles from './games/Bubbles';
import Quiz from './games/Quiz';

const KEYS = ['memoryGame', 'bubbleGame', 'quiz'];

export default function Games() {
  const { t } = useLang();
  const [tab, setTab] = useState(0);
  const labels = KEYS.map(t);
  return (
    <>
      <h2>{t('games')}</h2>
      <p className="muted">A few calm minutes for yourself. No scores to beat, no timers to worry about.</p>
      <Tabs tabs={labels} active={labels[tab]} onChange={(label) => setTab(labels.indexOf(label))} />
      {tab === 0 && <Memory />}
      {tab === 1 && <Bubbles />}
      {tab === 2 && <Quiz />}
    </>
  );
}
