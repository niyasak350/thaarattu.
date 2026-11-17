import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ageText, formatDate } from '../api';
import Tabs from '../components/Tabs';
import GrowthTab from './child/GrowthTab';
import VaccinesTab from './child/VaccinesTab';
import NutritionTab from './child/NutritionTab';
import HealthTab from './child/HealthTab';
import PhotosTab from './child/PhotosTab';

const TABS = ['Growth', 'Vaccination', 'Nutrition', 'Health', 'Photos'];

export default function ChildDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [tab, setTab] = useState(TABS[0]);

  useEffect(() => {
    api('/children/' + id).then(setChild).catch(() => navigate('/children'));
  }, [id]);

  async function removeChild() {
    if (!confirm('Delete ' + child.name + ' and all records?')) return;
    await api('/children/' + id, 'DELETE');
    navigate('/children');
  }

  if (!child) return <p className="center">Loading...</p>;

  return (
    <>
      <p><Link to="/children">&larr; My Baby</Link> · <Link to="/children?tab=guide">Care guide</Link></p>
      <div className="title-row">
        <h2>
          {child.name}{' '}
          <span className="muted">
            · {ageText(child.dob)} old · born {formatDate(child.dob)}
            {child.blood_group && ' · ' + child.blood_group}
          </span>
        </h2>
        <button className="danger small" onClick={removeChild}>Delete profile</button>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'Growth' && <GrowthTab child={child} />}
      {tab === 'Vaccination' && <VaccinesTab child={child} />}
      {tab === 'Nutrition' && <NutritionTab child={child} onChildChange={setChild} />}
      {tab === 'Health' && <HealthTab child={child} />}
      {tab === 'Photos' && <PhotosTab child={child} />}
    </>
  );
}
