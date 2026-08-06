/* Dependency-free SVG donut — error signature / distribution charts. */

const PALETTE = ['brand', 'good', 'warn', 'bad', 'text-dim', 'text-faint'];

export default function Donut({ data, size = 160, thickness = 22 }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={thickness} />
          {data.map((d, i) => {
            const frac = d.value / total;
            const dash = frac * c;
            const el = (
              <circle
                key={d.label}
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={`var(--${d.tone || PALETTE[i % PALETTE.length]})`}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return el;
          })}
        </g>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="700" fill="var(--text)">
          {total}
        </text>
      </svg>
      <div style={{ display: 'grid', gap: 6 }}>
        {data.map((d, i) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: `var(--${d.tone || PALETTE[i % PALETTE.length]})` }} />
            <span style={{ color: 'var(--text-dim)' }}>{d.label}</span>
            <span style={{ color: 'var(--text-faint)' }}>{d.value}{d.pct != null ? ` (${d.pct}%)` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
