/* Students × Topics accuracy heatmap — dependency-free HTML grid (no SVG needed). */

import { toneForAccuracy } from './ui.jsx';

function cellBg(acc) {
  if (acc == null) return 'var(--panel-2)';
  const tone = toneForAccuracy(acc);
  const alpha = 0.15 + (Math.abs(acc - 50) / 50) * 0.45; // stronger colour further from 50
  return `color-mix(in srgb, var(--${tone}) ${Math.round(alpha * 100)}%, var(--panel-2))`;
}

export default function HeatmapGrid({ students, topics, cells }) {
  const byKey = {};
  for (const c of cells) byKey[`${c.student_id}:${c.wiswits_id}`] = c.accuracy;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ position: 'sticky', left: 0, background: 'var(--panel)', padding: '4px 8px', textAlign: 'left', color: 'var(--text-faint)' }}>Student</th>
            {topics.map((t) => (
              <th key={t.id} title={t.label} style={{ padding: '4px 6px', color: 'var(--text-faint)', fontWeight: 500, writingMode: 'vertical-rl', textOrientation: 'mixed', maxHeight: 90 }}>
                {t.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td style={{ position: 'sticky', left: 0, background: 'var(--panel)', padding: '4px 8px', whiteSpace: 'nowrap', color: 'var(--text-dim)' }}>{s.name}</td>
              {topics.map((t) => {
                const acc = byKey[`${s.id}:${t.id}`];
                return (
                  <td key={t.id} title={`${t.label}: ${acc ?? '—'}%`} style={{ width: 26, height: 22, background: cellBg(acc), textAlign: 'center', border: '1px solid var(--bg)' }}>
                    {acc != null ? acc : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
