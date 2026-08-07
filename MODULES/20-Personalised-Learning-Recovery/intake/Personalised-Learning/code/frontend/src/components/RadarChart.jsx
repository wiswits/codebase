/* Dependency-free SVG radar/spider chart — the Bloom radar (spec chart #2). */

export default function RadarChart({ data, size = 220, max = 100 }) {
  const keys = Object.keys(data);
  const n = keys.length;
  if (!n) return null;
  const cx = size / 2, cy = size / 2, r = size / 2 - 34;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, val) => {
    const a = angle(i);
    const rad = (val / max) * r;
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const poly = keys.map((k, i) => point(i, data[k]).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }}>
      {rings.map((f) => (
        <polygon key={f} points={keys.map((_, i) => point(i, max * f).join(',')).join(' ')} fill="none" stroke="var(--border)" strokeWidth="1" />
      ))}
      {keys.map((_, i) => {
        const [x, y] = point(i, max);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />;
      })}
      <polygon points={poly} fill="var(--brand)" fillOpacity="0.28" stroke="var(--brand)" strokeWidth="2" />
      {keys.map((k, i) => {
        const [x, y] = point(i, data[k]);
        const [lx, ly] = point(i, max * 1.22);
        return (
          <g key={k}>
            <circle cx={x} cy={y} r="3.5" fill="var(--brand)" />
            <text x={lx} y={ly} fontSize="11" fill="var(--text-dim)" textAnchor="middle" dominantBaseline="middle">
              {k} {data[k]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
