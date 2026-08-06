/* Dependency-free SVG line chart — the 61.3% → 81.33% proof curve.
   (Production swaps this for Recharts per spec Part 9.) */

export default function LineChart({ points, labels, min = 55, max = 85, height = 220 }) {
  const w = 640;
  const h = height;
  const padX = 40;
  const padY = 24;
  const span = max - min;
  const x = (i) => padX + (i / (points.length - 1)) * (w - padX * 2);
  const y = (v) => padY + (1 - (v - min) / span) * (h - padY * 2);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p)}`).join(' ');
  const area = `${path} L ${x(points.length - 1)} ${h - padY} L ${x(0)} ${h - padY} Z`;

  const grid = [];
  for (let v = min; v <= max; v += 5) grid.push(v);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Class improvement curve">
      <defs>
        <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {grid.map((v) => (
        <g key={v}>
          <line x1={padX} y1={y(v)} x2={w - padX} y2={y(v)} stroke="var(--border)" strokeWidth="1" />
          <text x={8} y={y(v) + 4} fontSize="11" fill="var(--text-faint)">{v}%</text>
        </g>
      ))}

      <path d={area} fill="url(#fill)" />
      <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p)} r={i === points.length - 1 ? 5 : 3.5} fill="var(--brand)" stroke="var(--panel)" strokeWidth="2" />
          <text x={x(i)} y={h - 6} fontSize="11" fill="var(--text-faint)" textAnchor="middle">{labels[i]}</text>
          <text x={x(i)} y={y(p) - 12} fontSize="11" fill="var(--text-dim)" textAnchor="middle">{p}</text>
        </g>
      ))}
    </svg>
  );
}
