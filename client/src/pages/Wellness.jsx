import { useState } from 'react';
import Tabs from '../components/Tabs';
import MoodTab from './wellness/MoodTab';
import ScreeningTab from './wellness/ScreeningTab';
import SleepTab from './wellness/SleepTab';
import SelfCareTab from './wellness/SelfCareTab';
import RelaxTab from './wellness/RelaxTab';
import JournalTab from './wellness/JournalTab';
import { useLang } from '../i18n';

const TABS = ['Mood', 'Weekly Screening', 'Sleep & Recovery', 'Self-Care', 'Relax', 'Journal'];

export default function Wellness() {
  const { t } = useLang();
  const [tab, setTab] = useState(TABS[0]);
  return (
    <>
      <h2>{t('wellness')}</h2>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'Mood' && <MoodTab />}
      {tab === 'Weekly Screening' && <ScreeningTab />}
      {tab === 'Sleep & Recovery' && <SleepTab />}
      {tab === 'Self-Care' && <SelfCareTab />}
      {tab === 'Relax' && <RelaxTab />}
      {tab === 'Journal' && <JournalTab />}
    </>
  );
}
