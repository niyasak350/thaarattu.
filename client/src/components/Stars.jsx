// Shows "★ 4.5 (3 reviews)" or "No reviews yet"
export default function Stars({ rating, count }) {
  if (!rating) return <span className="muted">No reviews yet</span>;
  return (
    <span className="stars">
      ★ {Number(rating).toFixed(1)}
      {count != null && <span className="muted"> ({count} {count === 1 ? 'review' : 'reviews'})</span>}
    </span>
  );
}
