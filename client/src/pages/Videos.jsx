import { useEffect, useState } from 'react';
import { api } from '../api';
import { useLang } from '../i18n';

// "https://youtu.be/ID" or "https://www.youtube.com/watch?v=ID" -> the address YouTube allows inside a page
function embedLink(url) {
  const found = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  return found ? 'https://www.youtube.com/embed/' + found[1] : null;
}

const CATEGORIES = [['all', 'All'], ['pregnancy', 'Pregnancy'], ['baby', 'Baby care'], ['wellbeing', 'Wellbeing']];

// Helpful videos chosen by the admin (Admin > Videos)
export default function Videos() {
  const { t } = useLang();
  const [videos, setVideos] = useState(null);
  const [category, setCategory] = useState('all');
  useEffect(() => { api('/content/videos').then(setVideos); }, []);

  const shown = (videos || []).filter((v) => (category === 'all' || v.category === category) && embedLink(v.url));

  return (
    <>
      <h2>{t('videos')}</h2>
      <div className="choices">
        {CATEGORIES.map(([value, text]) => (
          <button key={value} type="button" className={category === value ? 'choice on' : 'choice'} onClick={() => setCategory(value)}>{text}</button>
        ))}
      </div>
      {videos && shown.length === 0 && <p className="center">No videos here yet. The admin can add YouTube videos from the admin panel.</p>}
      <div className="videos">
        {shown.map((v) => (
          <figure className="card video" key={v.id}>
            <iframe src={embedLink(v.url)} title={v.title} loading="lazy" allowFullScreen
              allow="accelerometer; encrypted-media; picture-in-picture" />
            <b>{v.title}</b>
          </figure>
        ))}
      </div>
    </>
  );
}
