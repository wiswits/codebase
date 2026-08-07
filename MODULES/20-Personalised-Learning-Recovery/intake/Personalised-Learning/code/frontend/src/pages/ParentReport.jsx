/* 💛⭐⭐⭐ Parent Progress Report — the full picture, re-toned for a parent
   audience. Structurally a close cousin of ProgressReport.jsx (journey,
   root-cause tree, recovery history, Bloom radar, next steps) but:
     - warmer, plainer-language copy throughout
     - comparison section kept minimal: self-trend + at most ONE encouraging
       class-context line — NO class/topper table (that's the teacher view).
   Fully live from GET /analytics/student/:id/report. Never renders a rank,
   leaderboard, topper name, or "bottom X%" language. */

import { useEffect, useState } from 'react';
import { Panel, StatCard, Bar } from '../components/ui.jsx';
import LineChart from '../components/LineChart.jsx';
import RadarChart from '../components/RadarChart.jsx';

const STUDENT_ID = 900303;
const HEADERS = { 'x-role': 'parent', 'x-org-id': '9001' };

export default function ParentReport() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch(`/api/pl/analytics/student/${STUDENT_ID}/report?subject_id=9001`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then(setData)
      .catch((e) => setErr(e.detail || e.error || 'failed to load'));
  }, []);

  if (err) return <Panel><span style={{ color: 'var(--bad)' }}>⚠️ {err} — run <code>npm run migrate && npm run seed</code> in backend/.</span></Panel>;
  if (!data) return <Panel>💛 Loading the report…</Panel>;

  const { student, headline, journey, root_cause, recovery_history, profile, comparison, next_steps } = data;
  const points = journey.map((j) => j.acc);
  const labels = journey.map((j, i) => `T${i + 1}`);
  const min = Math.max(0, Math.min(...points) - 10);
  const max = Math.min(100, Math.max(...points) + 10);
  const firstName = student.name.split(' ')[0];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>💛 {student.name}'s Full Progress Report</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Mathematics · a warm, complete look at {journey.length} recorded tests</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
        <StatCard value={`${headline.current_avg ?? '—'}%`} label="Current avg" tone="brand" />
        <StatCard value={headline.since_first_delta != null ? `${headline.since_first_delta >= 0 ? '+' : ''}${headline.since_first_delta}%` : '—'} label="Since T1" tone={headline.since_first_delta >= 0 ? 'good' : 'warn'} />
        <StatCard value={headline.gaps_found} label="Gaps found" />
        <StatCard value={headline.gaps_closed} label="Gaps closed 🎉" tone="good" />
      </div>

      <Panel title="📈 The Journey So Far">
        <LineChart points={points} labels={labels} min={min} max={max} />
        <p style={{ marginTop: 12, marginBottom: 0, fontSize: 13, color: 'var(--text-dim)' }}>
          Every dot here is a test {firstName} has taken. Ups and downs are completely normal — what matters is the overall story of learning.
        </p>
      </Panel>

      {root_cause.tree.length > 0 && (
        <Panel title="🎯 What's Really Going On">
          <p style={{ marginTop: 0, marginBottom: 16, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Sometimes one tricky topic quietly makes other topics harder too. Here's the chain we found for {firstName} — start at the top, and fixing it tends to help everything below it too.
          </p>
          <div style={{ display: 'grid', justifyItems: 'center', gap: 0 }}>
            {root_cause.tree.map((w, i) => (
              <div key={w.wiswits_id} style={{ display: 'grid', justifyItems: 'center' }}>
                <div style={{
                  border: `2px solid var(--${w.is_root_cause ? 'bad' : 'border'})`,
                  background: w.is_root_cause ? 'var(--bad-soft)' : 'var(--panel-2)',
                  borderRadius: 'var(--radius)', padding: '12px 20px', minWidth: 300, textAlign: 'center',
                }}>
                  {w.is_root_cause && <div style={{ color: 'var(--bad)', fontWeight: 700, fontSize: 11, marginBottom: 4 }}>💡 THE REAL REASON — START HERE</div>}
                  <div style={{ fontWeight: 600 }}>{w.label}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 2 }}>
                    {w.accuracy}% · {w.status === 'closed' ? 'sorted ✅' : w.status.replace('_', ' ')}{!w.is_root_cause && ` · knock-on effect (step ${w.depth_from_root})`}
                  </div>
                </div>
                {i < root_cause.tree.length - 1 && <div style={{ color: 'var(--text-faint)', padding: '4px 0', fontSize: 12 }}>│ makes this harder too ▼</div>}
              </div>
            ))}
          </div>
          {root_cause.tree.length > 1 && (
            <div style={{ marginTop: 14, padding: 12, background: 'var(--brand-soft)', borderRadius: 'var(--radius-sm)', fontSize: 13, lineHeight: 1.6 }}>
              💬 In simple terms: <b>{root_cause.tree[0].label}</b> is the real reason <b>{root_cause.tree[root_cause.tree.length - 1].label}</b> feels hard. Fix the first one, and the rest tend to improve on their own.
            </div>
          )}
        </Panel>
      )}

      {recovery_history.length > 0 && (
        <Panel title="🔄 Wins Along the Way">
          <div style={{ display: 'grid', gap: 8 }}>
            {recovery_history.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: c.outcome === 'closed' ? 'var(--good-soft)' : 'var(--panel-2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                <span>{c.label}</span>
                <span style={{ fontWeight: 600 }}>
                  {c.from}% → {c.to != null ? `${c.to}%` : '?'}{c.outcome === 'closed' && c.to != null && c.from != null ? ' 🎉' : ''}
                </span>
                <WarmOutcome outcome={c.outcome} days={c.days} />
              </div>
            ))}
          </div>
          <p style={{ marginTop: 12, marginBottom: 0, fontSize: 13, color: 'var(--text-dim)' }}>
            Each of these was once a topic {firstName} struggled with — and worked through with practice and support.
          </p>
        </Panel>
      )}

      {profile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          <Panel title="🧠 Learning Strengths">
            <RadarChart data={profile.bloom} />
            <div style={{ marginTop: 10 }}>
              {profile.strengths.slice(0, 2).map((s) => (
                <div key={s.wiswits_id} style={{ fontSize: 12, color: 'var(--good)' }}>🏆 {firstName} is strong at {s.label} · {s.accuracy}%</div>
              ))}
            </div>
          </Panel>

          <Panel title="A Note From the System">
            <div style={{ fontSize: 13, display: 'grid', gap: 6 }}>
              <Row label="Working pace" value={profile.pace} />
              <Row label="Learning style" value={profile.behaviour} />
            </div>
            <div style={{ marginTop: 12, padding: 12, background: 'var(--brand-soft)', borderRadius: 'var(--radius-sm)', fontSize: 13, lineHeight: 1.6 }}>
              💬 {profile.coaching_note}
            </div>
          </Panel>
        </div>
      )}

      {comparison && (
        <Panel title="📊 How Things Are Trending">
          <div style={{ padding: 12, background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 8 }}>
              {firstName}'s own trend: {comparison.self.trend === 'improving' ? '📈 improving' : comparison.self.trend === 'declining' ? 'settling — completely normal, support is in place' : 'steady'}
              {comparison.self.best != null && ` · best so far: ${comparison.self.best}%`}
            </div>
            <Bar pct={headline.current_avg ?? 0} />
          </div>
          {comparison.narrative && comparison.narrative[1] && (
            <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-dim)' }}>
              {comparison.narrative[1]}
            </div>
          )}
        </Panel>
      )}

      {next_steps.length > 0 && (
        <Panel title="🎯 What Can Help Next">
          <div style={{ display: 'grid', gap: 8 }}>
            {next_steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                <span>{s.icon}</span><span>{s.text}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--text-faint)' }}>{label}</span>
      <span style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

function WarmOutcome({ outcome, days }) {
  const tone = { closed: 'good', improved: 'brand', no_change: 'warn', worsened: 'text-dim' }[outcome] || 'text-dim';
  const label = { closed: '✅ Sorted', improved: '🔄 Getting there', no_change: '➡️ Still working on it', worsened: '💪 Needs a bit more support' }[outcome] || outcome;
  return (
    <span style={{ fontSize: 12, color: `var(--${tone})`, whiteSpace: 'nowrap' }}>
      {label}{days ? ` · ${days} days` : ''}
    </span>
  );
}
