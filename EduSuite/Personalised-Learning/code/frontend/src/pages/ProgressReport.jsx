/* ⭐⭐⭐ Student Progress Report — the complete picture (spec 8.3).
   Journey · Root cause tree · Recovery history · Learning profile (Bloom
   radar, error signature, behaviour) · dignity-safe comparison · next steps.
   Fully live — every number comes from GET /analytics/student/:id/report. */

import { useEffect, useState } from 'react';
import { Panel, StatCard, Bar, toneForAccuracy } from '../components/ui.jsx';
import LineChart from '../components/LineChart.jsx';
import RadarChart from '../components/RadarChart.jsx';

// Student 900303 has a real, seeded multi-depth root-cause chain
// (Ch01 root → Ch03 depth 2 → Ch07 depth 3, critical) — the Aarav money example.
const STUDENT_ID = 900303;

export default function ProgressReport() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch(`/api/pl/analytics/student/${STUDENT_ID}/report?subject_id=9001`, { headers: { 'x-role': 'parent', 'x-org-id': '9001' } })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then(setData)
      .catch((e) => setErr(e.detail || e.error || 'failed to load'));
  }, []);

  if (err) return <Panel><span style={{ color: 'var(--bad)' }}>⚠️ {err} — run <code>npm run migrate && npm run seed</code> in backend/.</span></Panel>;
  if (!data) return <Panel>Loading report…</Panel>;

  const { student, headline, journey, root_cause, recovery_history, profile, comparison, next_steps } = data;
  const points = journey.map((j) => j.acc);
  const labels = journey.map((j, i) => `T${i + 1}`);
  const min = Math.max(0, Math.min(...points) - 10);
  const max = Math.min(100, Math.max(...points) + 10);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>{student.name} · Progress Report</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Mathematics · live from {journey.length} recorded tests</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
        <StatCard value={`${headline.current_avg ?? '—'}%`} label="Current avg" />
        <StatCard value={headline.since_first_delta != null ? `${headline.since_first_delta >= 0 ? '+' : ''}${headline.since_first_delta}%` : '—'} label={`Since T1`} tone={headline.since_first_delta >= 0 ? 'good' : 'bad'} />
        <StatCard value={headline.gaps_found} label="Gaps found" />
        <StatCard value={headline.gaps_closed} label="Closed" tone="good" />
        <StatCard value={headline.percentile != null ? `${headline.percentile}th` : '—'} label="Percentile" tone="brand" />
      </div>

      <Panel title="📈 The Journey">
        <LineChart points={points} labels={labels} min={min} max={max} />
      </Panel>

      {root_cause.tree.length > 0 && (
        <Panel title="🎯 Root Cause Analysis">
          <div style={{ display: 'grid', justifyItems: 'center', gap: 0 }}>
            {root_cause.tree.map((w, i) => (
              <div key={w.wiswits_id} style={{ display: 'grid', justifyItems: 'center' }}>
                <div style={{
                  border: `2px solid var(--${w.is_root_cause ? 'bad' : 'border'})`,
                  background: w.is_root_cause ? 'var(--bad-soft)' : 'var(--panel-2)',
                  borderRadius: 'var(--radius)', padding: '12px 20px', minWidth: 300, textAlign: 'center',
                }}>
                  {w.is_root_cause && <div style={{ color: 'var(--bad)', fontWeight: 700, fontSize: 11, marginBottom: 4 }}>🚨 ROOT CAUSE — START HERE</div>}
                  <div style={{ fontWeight: 600 }}>{w.label}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 2 }}>
                    {w.accuracy}% · {w.severity} · {w.status}{!w.is_root_cause && ` · symptom (depth ${w.depth_from_root})`}
                  </div>
                </div>
                {i < root_cause.tree.length - 1 && <div style={{ color: 'var(--text-faint)', padding: '4px 0', fontSize: 12 }}>│ enables ▼</div>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {recovery_history.length > 0 && (
        <Panel title="🔄 Recovery History">
          <div style={{ display: 'grid', gap: 8 }}>
            {recovery_history.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                <span>{c.label}</span>
                <span style={{ color: 'var(--text-dim)' }}>
                  {c.from}% → {c.to != null ? `${c.to}%` : '?'}
                </span>
                <OutcomeBadge outcome={c.outcome} cycles={c.cycles} days={c.days} />
              </div>
            ))}
          </div>
        </Panel>
      )}

      {profile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          <Panel title="🧠 Bloom Radar">
            <RadarChart data={profile.bloom} />
            <div style={{ marginTop: 10 }}>
              {profile.strengths.slice(0, 2).map((s) => (
                <div key={s.wiswits_id} style={{ fontSize: 12, color: 'var(--good)' }}>🏆 {s.label} · {s.accuracy}%</div>
              ))}
            </div>
          </Panel>

          <Panel title="Error Signature">
            <div style={{ display: 'grid', gap: 8 }}>
              {profile.error_signature.map((e) => (
                <div key={e.reason} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 40px', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12 }}>{e.reason}</span>
                  <Bar pct={e.pct} tone="warn" />
                  <span style={{ fontSize: 12, textAlign: 'right' }}>{e.pct}%</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Behaviour">
            <div style={{ fontSize: 13, display: 'grid', gap: 6 }}>
              <Row label="Pace" value={profile.pace} />
              <Row label="Archetype" value={profile.behaviour} />
              <Row label="Silly mistakes" value={`${profile.silly_mistake_rate}%`} warn={profile.silly_mistake_rate > 35} />
              <Row label="Concept gaps" value={`${profile.concept_gap_rate}%`} />
              <Row label="Guessing" value={`${profile.guess_rate}%`} />
            </div>
            <div style={{ marginTop: 12, padding: 12, background: 'var(--brand-soft)', borderRadius: 'var(--radius-sm)', fontSize: 13, lineHeight: 1.5 }}>
              💬 {profile.coaching_note}
            </div>
          </Panel>
        </div>
      )}

      {comparison && (
        <Panel title="📊 Comparison">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['', 'You', 'Class', 'Topper'].map((h) => <th key={h} style={{ textAlign: h ? 'right' : 'left', color: 'var(--text-faint)', padding: '4px 8px', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '6px 8px' }}>Overall</td>
                <td style={tdr}>{comparison.my.accuracy}%</td>
                <td style={tdr}>{comparison.peers.class_avg ?? '—'}%</td>
                <td style={tdr}>{comparison.peers.topper ?? '—'}%</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 14, padding: 12, background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
              Percentile: {comparison.position.percentile}th · Band: {comparison.position.band.replace('_', ' ')}
            </div>
            <Bar pct={comparison.position.percentile} />
          </div>
          <div style={{ marginTop: 12, display: 'grid', gap: 4 }}>
            {comparison.narrative.map((l, i) => <div key={i} style={{ fontSize: 13 }}>{l}</div>)}
          </div>
        </Panel>
      )}

      {next_steps.length > 0 && (
        <Panel title="🎯 Next Steps">
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

function Row({ label, value, warn }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--text-faint)' }}>{label}</span>
      <span style={{ color: warn ? 'var(--warn)' : 'var(--text)', fontWeight: warn ? 700 : 400 }}>{value}{warn ? ' 🚨' : ''}</span>
    </div>
  );
}

function OutcomeBadge({ outcome, cycles, days }) {
  const tone = { closed: 'good', improved: 'brand', no_change: 'warn', worsened: 'bad' }[outcome] || 'text-dim';
  const label = { closed: '✅ CLOSED', improved: '🔄 IMPROVED', no_change: '➡️ NO CHANGE', worsened: '⚠️ WORSENED' }[outcome] || outcome;
  return (
    <span style={{ fontSize: 12, color: `var(--${tone})`, whiteSpace: 'nowrap' }}>
      {label} · {cycles} cycle{cycles > 1 ? 's' : ''}{days ? ` · ${days}d` : ''}
    </span>
  );
}

const tdr = { textAlign: 'right', padding: '6px 8px' };
