import { useEffect, useState } from 'react';
import { api, formatDate, today } from '../../api';
import { readPhoto } from '../../photo';
import AddToggle from '../../components/AddToggle';

// A little album of the child's photos and special moments
export default function PhotosTab({ child }) {
  const base = '/children/' + child.id + '/photos';
  const [photos, setPhotos] = useState([]);
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(today());
  const [error, setError] = useState('');
  const load = () => api(base).then(setPhotos);
  useEffect(() => { load(); }, [child.id]);

  async function choose(file) {
    setError('');
    if (!file) return;
    try { setPhoto(await readPhoto(file, { size: 900, square: false })); } catch (err) { setError(err.message); }
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    if (!photo) { setError('Please choose a photo first.'); return; }
    try {
      await api(base, 'POST', { photo, caption, taken_on: date });
      setPhoto(''); setCaption(''); setDate(today()); setOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this photo?')) return;
    await api(base + '/' + id, 'DELETE');
    load();
  }

  return (
    <>
      <AddToggle label="Add a photo" open={open} onOpen={() => setOpen(true)}>
        <form className="card" onSubmit={save}>
          <h3>New photo</h3>
          {error && <p className="error">{error}</p>}
          <label>Photo
            <input type="file" accept="image/*" onChange={(e) => choose(e.target.files[0])} />
          </label>
          {photo && <img src={photo} alt="" style={{ maxWidth: 220, borderRadius: 14, border: '2.5px solid var(--ink)', marginBottom: 12 }} />}
          <div className="row">
            <label>What is happening? (optional)
              <input value={caption} maxLength="150" onChange={(e) => setCaption(e.target.value)} placeholder="e.g. First smile" />
            </label>
            <label>Date
              <input type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
          </div>
          <button>Save photo</button>{' '}
          <button type="button" className="ghost" onClick={() => setOpen(false)}>Cancel</button>
        </form>
      </AddToggle>

      {photos.length === 0 && <p className="center">No photos yet. Keep {child.name}'s first smile, first steps and other little moments here.</p>}
      <div className="album">
        {photos.map((p) => (
          <figure key={p.id}>
            <img src={p.photo} alt={p.caption || 'Photo of ' + child.name} />
            {p.caption && <figcaption>{p.caption}</figcaption>}
            <small>{formatDate(p.taken_on)} <button className="link" onClick={() => remove(p.id)}>Delete</button></small>
          </figure>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 16 }}>Only you can see these photos. They are not shared with doctors.</p>
    </>
  );
}
