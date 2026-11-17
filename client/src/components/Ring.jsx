// Progress ring: a circle that fills up as the pregnancy moves on
export default function Ring({ percent, children }) {
  const length = 2 * Math.PI * 54;
  return (
    <div className="ring">
      <svg width="132" height="132" viewBox="0 0 132 132">
        <circle className="track" cx="66" cy="66" r="54" fill="none" strokeWidth="10" />
        <circle className="fill" cx="66" cy="66" r="54" fill="none" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={length} strokeDashoffset={length * (1 - percent / 100)} />
      </svg>
      <div>{children}</div>
    </div>
  );
}
