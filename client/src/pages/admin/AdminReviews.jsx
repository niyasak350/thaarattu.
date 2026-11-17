import { useEffect, useState } from 'react';
import { api, formatDate } from '../../api';
import Stars from '../../components/Stars';

export default function AdminReviews() {
  const [items, setItems] = useState([]);
  const load = () => api('/admin/reviews').then(setItems);
  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!confirm('Delete this review?')) return;
    await api('/admin/reviews/' + id, 'DELETE');
    load();
  }

  return (
    <>
      <h2>Doctor Reviews</h2>
      {items.length === 0 && <p className="muted">No reviews yet.</p>}
      {items.map((r) => (
        <div className="card" key={r.id}>
          <div className="title-row">
            <span><Stars rating={r.rating} /> for <b>{r.doctor}</b></span>
            <button className="small danger" onClick={() => remove(r.id)}>Delete</button>
          </div>
          {r.comment && <p>{r.comment}</p>}
          <span className="muted">{r.parent} · {formatDate(r.created_at)}</span>
        </div>
      ))}
    </>
  );
}
