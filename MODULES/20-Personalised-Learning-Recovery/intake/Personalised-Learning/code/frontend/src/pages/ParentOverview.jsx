/* 💛 Parent Overview — "How's my child doing?" (spec: parent-facing PL home).
   Warm, simple, big numbers. No jargon, no comparison tables — just the
   encouraging story. Live from GET /widgets/child-progress + GET /digest/student/:id.
   NOTE: GET /widgets/subject-health and POST /digest/send both 403 for role
   'parent' in this seed (need 'teacher'/'principal') — this page avoids them
   and only calls endpoints that are actually open to parents. */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel, StatCard } from '../components/ui.jsx';

// Student 900303 — the demo child with a rich, real recovery story.
const STUDENT_ID = 900303;
const HEADERS = { 'x-role': 'parent', 'x-org-id': '9001' };

export default function ParentOverview() {
  const [progress, setProgress] = useState(null);
  const [digest, setDigest] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/pl/widgets/child-progress?student_id=${STUDENT_ID}`, { headers: HEADERS })
        .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j)))),
      fetch(`/api/pl/digest/student/${STUDENT_ID}`, { headers: HEADERS })
        .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j)))),
    ])
      .then(([p, d]) => { setProgress(p); setDigest(d.preview || d); })
      .catch((e) => setErr(e.detail || e.error || 'failed to load'));
  }, []);

  if (err) return <Panel><span style={{ color: 'var(--bad)' }}>⚠️ {err} — run <code>npm run migrate && npm run seed</code> in backend/.</span></Panel>;
  if (!progress || !digest) return <Panel>Loading your child's progress…</Panel>;

  const name = digest.student_name || 'Your child';

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 26 }}>👋 Hi! Here's how {name} is doing</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Mathematics · a quick, friendly snapshot</p>
      </div>

      <Panel style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand)' }}>
        <div style={{ fontSize: 17, lineHeight: 1.6, fontWeight: 500 }}>
          💬 {progress.narrative}
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard value={`${progress.current_avg}%`} label="Current average" tone="brand" />
        <StatCard
          value={progress.delta_since_first != null ? `${progress.delta_since_first >= 0 ? '+' : ''}${progress.delta_since_first}%` : '—'}
          label="Improvement so far"
          tone={progress.delta_since_first >= 0 ? 'good' : 'warn'}
        />
        <StatCard value={progress.trend === 'improving' ? '📈 Improving' : progress.trend || '—'} label="Trend" />
      </div>

      <Panel title="🎉 Little Wins">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 44, fontWeight: 700, color: 'var(--good)' }}>{digest.gaps_closed ?? 0}</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            learning gaps closed so far — every one of these is a topic {name.split(' ')[0]} was stuck on and has now worked through. 🌟
          </div>
        </div>
        {digest.encouraging_line && (
          <div style={{ marginTop: 14, padding: 12, background: 'var(--good-soft)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500 }}>
            {digest.encouraging_line}
          </div>
        )}
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <Link to="/parent/pl/progress" style={{ textDecoration: 'none' }}>
          <Panel style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>📈 See the Progress Line</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>A simple picture of {name.split(' ')[0]}'s journey over time — just their own trend, no comparisons.</div>
          </Panel>
        </Link>
        <Link to="/parent/pl/report" style={{ textDecoration: 'none' }}>
          <Panel style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>📋 Full Progress Report</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>The complete story — what's improving, what needs a little more support, and what to do next.</div>
          </Panel>
        </Link>
      </div>
    </div>
  );
}
