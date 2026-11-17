import { useEffect, useState } from 'react';

// A row of photos on the first page. It appears only after the admin has added photos
// (Admin > First Page Photos).
export default function Scenes() {
  const [photos, setPhotos] = useState([]);
  useEffect(() => { fetch('/api/site-photos').then((res) => (res.ok ? res.json() : [])).then(setPhotos).catch(() => {}); }, []);
  if (photos.length === 0) return null;
  return (
    <section className="scenes">
      {photos.map((p) => (
        <figure className="scene" key={p.id}>
          <div className="frame"><img src={p.photo} alt={p.title} /></div>
          <figcaption>{p.title}</figcaption>
        </figure>
      ))}
    </section>
  );
}
