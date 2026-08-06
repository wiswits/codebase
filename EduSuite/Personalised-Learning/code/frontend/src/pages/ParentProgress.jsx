/* 💛 Parent Progress — Simple Progress Line (spec: "no class comparison,
   just self"). Reuses only the `journey` array from the mega report
   (GET /analytics/student/:id/report) — the rest of that payload is for
   ParentReport.jsx. No class-average / topper overlay anywhere on this page. */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel, StatCard } from '../components/ui.jsx';
import LineChart from '../components/LineChart.jsx';

const STUDENT_ID = 900303;
const HEADERS = { 'x-role': 'parent', 'x-org-id': '9001' };

export default function ParentProgress() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch(`/api/pl/analytics/student/${STUDENT_ID}/report?subject_id=9001`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then(setData)
      .catch((e) => setErr(e.detail || e.error || 'failed to load'));
  }, []);

  if (err) return <Panel><span style={{ color: 'var(--bad)' }}>⚠️ {err} — run <code>npm run migrate && npm run seed</code> in backend/.</span></Panel>;
  if (!data) return <Panel>Loading progress…</Panel>;

  const { student, headline, journey } = data;
  const points = journey.map((j) => j.acc);
  const labels = journey.map((j, i) => `T${i + 1}`);
  const min = Math.max(0, Math.min(...points) - 10);
  const max = Math.min(100, Math.max(...points) + 10);
  const firstLabel = student.name.split(' ')[0];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>📈 {student.name}'s Progress</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Just {firstLabel}'s own journey — no comparisons, just how far they've come.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard value={`${headline.current_avg ?? '—'}%`} label="Current average" tone="brand" />
        <StatCard
          value={headline.since_first_delta != null ? `${headline.since_first_delta >= 0 ? '+' : ''}${headline.since_first_delta}%` : '—'}
          label="Since the first test"
          tone={headline.since_first_delta >= 0 ? 'good' : 'warn'}
        />
        <StatCard value={headline.gaps_closed} label="Gaps closed" tone="good" />
      </div>

      <Panel title={`📈 The Journey — just ${firstLabel}, over time`}>
        <LineChart points={points} labels={labels} min={min} max={max} />
        <div style={{ marginTop: 14, padding: 12, background: 'var(--brand-soft)', borderRadius: 'var(--radius-sm)', fontSize: 14, lineHeight: 1.6 }}>
          {headline.since_first_delta >= 0
            ? `💬 ${firstLabel} has moved from ${points[0]}% to ${points[points.length - 1]}% across ${journey.length} tests — every step here is progress worth celebrating.`
            : `💬 ${firstLabel}'s latest score is ${points[points.length - 1]}%. Scores can dip test to test — what matters is the overall climb, and there's real support in place to keep it going.`}
        </div>
      </Panel>

      <Link to="/parent/pl/report" style={{ textDecoration: 'none' }}>
        <Panel style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>📋 Want the full picture? See the complete report →</div>
        </Panel>
      </Link>
    </div>
  );
}
