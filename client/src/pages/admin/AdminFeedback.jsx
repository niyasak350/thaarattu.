import { useEffect, useState } from 'react';
import { api, formatDate } from '../../api';

export default function AdminFeedback() {
  const [items, setItems] = useState([]);
  const load = () => api('/admin/feedback').then(setItems);
  useEffect(() => { load(); }, []);
  const remove = async (id) => { await api('/admin/feedback/' + id, 'DELETE'); load(); };

  return (
    <>
      <h2>Feedback</h2>
      {items.length === 0 && <p className="muted">No feedback yet.</p>}
      {items.map((f) => (
        <div className="card" key={f.id}>
          <p>{f.message}</p>
          <span className="muted">{f.name} ({f.email}) · {formatDate(f.created_at)}</span>{' '}
          <button className="link" onClick={() => remove(f.id)}>Delete</button>
        </div>
      ))}
    </>
  );
}
