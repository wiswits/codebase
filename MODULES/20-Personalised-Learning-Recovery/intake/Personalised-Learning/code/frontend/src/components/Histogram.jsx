/* Dependency-free SVG bar histogram — score distributions, question difficulty. */

export default function Histogram({ bins, height = 180, tone = 'brand', markers = [] }) {
  const w = 640;
  const h = height;
  const padX = 30;
  const padY = 20;
  const max = Math.max(1, ...bins.map((b) => b.count));
  const bw = (w - padX * 2) / bins.length;

  const y = (v) => padY + (1 - v / max) * (h - padY * 2 - 16);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%">
      <line x1={padX} y1={h - padY - 16} x2={w - padX} y2={h - padY - 16} stroke="var(--border)" />
      {bins.map((b, i) => {
        const x = padX + i * bw;
        const barH = (h - padY * 2 - 16) - (y(b.count) - padY);
        return (
          <g key={i}>
            <rect x={x + bw * 0.12} y={y(b.count)} width={bw * 0.76} height={barH} rx="3" fill={`var(--${b.tone || tone})`} opacity="0.85" />
            <text x={x + bw / 2} y={y(b.count) - 6} fontSize="10" fill="var(--text-faint)" textAnchor="middle">{b.count || ''}</text>
            <text x={x + bw / 2} y={h - 4} fontSize="10" fill="var(--text-faint)" textAnchor="middle">{b.label}</text>
          </g>
        );
      })}
      {markers.map((m) => {
        const idx = bins.findIndex((b) => m.value >= b.lo && m.value <= b.hi);
        const x = idx >= 0 ? padX + idx * bw + bw / 2 : null;
        if (x == null) return null;
        return (
          <g key={m.label}>
            <line x1={x} y1={padY} x2={x} y2={h - padY - 16} stroke={`var(--${m.tone || 'bad'})`} strokeDasharray="3 3" />
            <text x={x} y={padY - 4} fontSize="10" fill={`var(--${m.tone || 'bad'})`} textAnchor="middle">{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
