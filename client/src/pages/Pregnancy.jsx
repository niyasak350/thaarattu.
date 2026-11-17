import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useLang } from '../i18n';
import Tabs from '../components/Tabs';
import PregnancySetup from './pregnancy/Setup';
import OverviewTab from './pregnancy/OverviewTab';
import FoodTab from './pregnancy/FoodTab';
import CheckupsTab from './pregnancy/CheckupsTab';
import KickTab from './pregnancy/KickTab';
import ContractionTab from './pregnancy/ContractionTab';

// tab id in the address (?tab=food) -> word key in i18n.jsx
const TABS = { overview: 'overview', food: 'food', checkups: 'checkups', kicks: 'kickCounter', contractions: 'contractions' };

export default function Pregnancy() {
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const [pregnancy, setPregnancy] = useState(undefined); // undefined = loading, null = none
  const load = () => api('/pregnancy').then(setPregnancy);
  useEffect(() => { load(); }, []);

  const tab = TABS[params.get('tab')] ? params.get('tab') : 'overview';
  const labels = Object.values(TABS).map(t);
  const setTab = (label) => setParams({ tab: Object.keys(TABS)[labels.indexOf(label)] });

  if (pregnancy === undefined) return <p className="center">Loading...</p>;

  return (
    <>
      <h2>{t('pregnancy')}</h2>
      <Tabs tabs={labels} active={t(TABS[tab])} onChange={setTab} />
      {tab === 'overview' && (pregnancy
        ? <OverviewTab pregnancy={pregnancy} reload={load} />
        : <PregnancySetup onSaved={load} />)}
      {tab === 'food' && <FoodTab trimester={pregnancy ? pregnancy.trimester : 1} />}
      {tab === 'checkups' && <CheckupsTab hasPregnancy={!!pregnancy} />}
      {tab === 'kicks' && <KickTab />}
      {tab === 'contractions' && <ContractionTab />}
    </>
  );
}
