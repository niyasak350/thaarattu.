// The app's mark: two overlapping rings (mother and child) on a green tile
export default function Logo({ size = 34 }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="var(--primary)" />
      <circle cx="17" cy="19" r="8.500" fill="none" stroke="var(--on-primary)" strokeWidth="3" />
      <circle cx="25.500" cy="24" r="5" fill="var(--primary)" stroke="var(--on-primary)" strokeWidth="3" />
    </svg>
  );
}
