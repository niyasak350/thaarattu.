// Simple tab buttons. Usage: <Tabs tabs={['A', 'B']} active={tab} onChange={setTab} />
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t} type="button" className={t === active ? 'tab on' : 'tab'} onClick={() => onChange(t)}>
          {t}
        </button>
      ))}
    </div>
  );
}
