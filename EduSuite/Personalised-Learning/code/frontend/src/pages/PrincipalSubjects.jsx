/* Principal · Subject Health — subject-by-subject breakdown for the whole
   school. Live from GET /widgets/subject-health, which in this seed
   returns a single Mathematics row — the UI is built to handle an array
   generically so it keeps working once more subjects are seeded.
   Visual language matches PrincipalRecoveryStats.jsx (Panel/StatCard/Bar). */

import { useEffect, useState } from 'react';
import { Panel, StatCard, Bar, toneForAccuracy } from '../components/ui.jsx';

const HEADERS = { 'x-role': 'principal', 'x-org-id': '9001' };

export default function PrincipalSubjects() {
  const [subjects, setSubjects] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch('/api/pl/widgets/subject-health', { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((j) => setSubjects(Array.isArray(j) ? j : []))
      .catch((e) => setErr(e.detail || e.error || 'failed to load'));
  }, []);

  if (err) return <Panel><span style={{ color: 'var(--bad)' }}>⚠️ {err} — run <code>npm run migrate && npm run seed</code> in backend/.</span></Panel>;
  if (!subjects) return <Panel>Loading subject health…</Panel>;

  const totalGaps = subjects.reduce((a, s) => a + (s.gaps || 0), 0);
  const totalClosed = subjects.reduce((a, s) => a + (s.closed || 0), 0);
  const overallRate = totalGaps ? Math.round((totalClosed / totalGaps) * 100) : 0;
  const overallAvg = subjects.length
    ? Math.round(subjects.reduce((a, s) => a + (s.avg_accuracy || 0), 0) / subjects.length)
    : 0;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>Subject Health · School-wide</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Har subject me kitne gaps ban rahe hain, aur kitne band ho rahe hain.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
        <StatCard value={subjects.length} label="Subjects" />
        <StatCard value={`${overallAvg}%`} label="Avg accuracy" tone={overallAvg ? toneForAccuracy(overallAvg) : 'text'} />
        <StatCard value={totalGaps.toLocaleString()} label="Gaps found" />
        <StatCard value={totalClosed.toLocaleString()} label="Closed" tone="good" />
        <StatCard value={`${overallRate}%`} label="Close rate" tone={overallRate >= 50 ? 'good' : 'warn'} />
      </div>

      <Panel title="Subject Breakdown">
        {subjects.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: 13 }}>No subject data yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {subjects.map((s) => {
              const rate = s.close_rate ?? (s.gaps ? Math.round((s.closed / s.gaps) * 100) : 0);
              const tone = toneForAccuracy(s.avg_accuracy ?? 0);
              return (
                <div key={s.subject_id ?? s.name} style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                      {s.avg_accuracy ?? '—'}% avg · {s.gaps ?? 0} gaps · {s.closed ?? 0} closed ({rate}%){rate < 50 ? ' ⚠️' : ' ✅'}
                    </span>
                  </div>
                  <Bar pct={s.avg_accuracy ?? 0} tone={tone} height={12} />
                </div>
              );
            })}
          </div>
        )}
        {subjects.length === 1 && (
          <p style={{ marginTop: 16, marginBottom: 0, fontSize: 12, color: 'var(--text-faint)' }}>
            Only {subjects[0].name} is seeded for this org right now — more subjects will appear here automatically as they're added.
          </p>
        )}
      </Panel>
    </div>
  );
}
