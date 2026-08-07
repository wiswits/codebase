/* Horizontal stacked bar — time-health, Bloom distribution planned-vs-actual. */

const PALETTE = ['brand', 'good', 'warn', 'bad', 'text-dim'];

export default function StackedBar({ segments, height = 28 }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div>
      <div style={{ display: 'flex', height, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {segments.map((s, i) => (
          <div
            key={s.label}
            title={`${s.label}: ${s.value}`}
            style={{ width: `${(s.value / total) * 100}%`, background: `var(--${s.tone || PALETTE[i % PALETTE.length]})`, minWidth: s.value ? 2 : 0 }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
        {segments.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: `var(--${s.tone || PALETTE[i % PALETTE.length]})` }} />
            <span style={{ color: 'var(--text-dim)' }}>{s.label}</span>
            <span style={{ color: 'var(--text-faint)' }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
