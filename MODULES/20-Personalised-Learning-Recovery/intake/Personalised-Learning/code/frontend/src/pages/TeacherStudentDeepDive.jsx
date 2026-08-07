/* ⭐⭐ Teacher Student Deep-Dive — same data as ProgressReport.jsx (spec 8.3) but
   teacher-framed: worksheet generation + weak-area status override actions.
   GET /analytics/student/:id/report?subject_id=9001  (journey/root-cause/bloom/comparison)
   GET /weak-areas?student=:id                         (raw rows with ids, for PATCH)
   PATCH /weak-areas/:id/status  {status, reason}       (reason mandatory — API 400s without it) */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Panel, StatCard, Bar } from '../components/ui.jsx';
import LineChart from '../components/LineChart.jsx';
import RadarChart from '../components/RadarChart.jsx';

const HEADERS = { 'x-role': 'teacher', 'x-org-id': '9001' };
// Fallback demo student — 900303 has a real, seeded multi-depth root-cause chain
// (Ch01 root → Ch03 depth 2 → Ch07 depth 3, critical, in_recovery).
const DEFAULT_STUDENT_ID = 900303;

const STATUS_OPTIONS = ['open', 'in_recovery', 'closed', 'escalated'];

export default function TeacherStudentDeepDive() {
  const { id } = useParams();
  const studentId = Number(id) || DEFAULT_STUDENT_ID;

  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  const [weakAreas, setWeakAreas] = useState(null);
  const [waErr, setWaErr] = useState(null);

  const [genMsg, setGenMsg] = useState(null);
  const [genLoading, setGenLoading] = useState(false);

  const [overrides, setOverrides] = useState({}); // wa.id -> { status, reason }
  const [overrideMsg, setOverrideMsg] = useState({}); // wa.id -> { tone, text }
  const [overrideLoading, setOverrideLoading] = useState({});

  useEffect(() => {
    setData(null); setErr(null);
    fetch(`/api/pl/analytics/student/${studentId}/report?subject_id=9001`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then(setData)
      .catch((e) => setErr(e.detail || e.error || 'failed to load report'));

    setWeakAreas(null); setWaErr(null);
    fetch(`/api/pl/weak-areas?student=${studentId}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((d) => setWeakAreas(d.weak_areas ?? []))
      .catch((e) => setWaErr(e.detail || e.error || 'failed to load weak areas'));
  }, [studentId]);

  async function generateWorksheet() {
    setGenLoading(true); setGenMsg(null);
    try {
      const res = await fetch('/api/pl/worksheets/generate', {
        method: 'POST',
        headers: { ...HEADERS, 'content-type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, opts: {} }),
      });
      const d = await res.json();
      if (d?.skip_worksheet) {
        setGenMsg({ tone: 'warn', text: `💬 Coaching instead: ${d.message || d.reason || 'no worksheet needed'}` });
      } else if (res.ok && d?.id) {
        setGenMsg({ tone: 'good', text: `✅ Worksheet #${d.id} generated (${d.total_questions ?? '?'} Qs, strategy: ${d.strategy || '—'})` });
      } else {
        setGenMsg({ tone: 'bad', text: `⚠️ ${d?.error || 'generation failed'}` });
      }
    } catch (e) {
      setGenMsg({ tone: 'bad', text: `⚠️ ${e.message}` });
    } finally {
      setGenLoading(false);
    }
  }

  function setOverride(waId, patch) {
    setOverrides((s) => ({ ...s, [waId]: { status: '', reason: '', ...s[waId], ...patch } }));
  }

  async function submitOverride(wa) {
    const o = overrides[wa.id] || {};
    if (!o.status) {
      setOverrideMsg((s) => ({ ...s, [wa.id]: { tone: 'bad', text: 'Pick a status first.' } }));
      return;
    }
    if (!o.reason?.trim()) {
      setOverrideMsg((s) => ({ ...s, [wa.id]: { tone: 'bad', text: 'Reason is required.' } }));
      return;
    }
    setOverrideLoading((s) => ({ ...s, [wa.id]: true }));
    setOverrideMsg((s) => ({ ...s, [wa.id]: null }));
    try {
      const res = await fetch(`/api/pl/weak-areas/${wa.id}/status`, {
        method: 'PATCH',
        headers: { ...HEADERS, 'content-type': 'application/json' },
        body: JSON.stringify({ status: o.status, reason: o.reason }),
      });
      const d = await res.json();
      if (res.ok) {
        setOverrideMsg((s) => ({ ...s, [wa.id]: { tone: 'good', text: '✅ Status updated.' } }));
        setWeakAreas((list) => list.map((w) => (w.id === wa.id ? { ...w, status: o.status } : w)));
      } else {
        setOverrideMsg((s) => ({ ...s, [wa.id]: { tone: 'bad', text: `⚠️ ${d?.error || 'update failed'}` } }));
      }
    } catch (e) {
      setOverrideMsg((s) => ({ ...s, [wa.id]: { tone: 'bad', text: `⚠️ ${e.message}` } }));
    } finally {
      setOverrideLoading((s) => ({ ...s, [wa.id]: false }));
    }
  }

  if (err) return <Panel><span style={{ color: 'var(--bad)' }}>⚠️ {err} — run <code>npm run migrate && npm run seed</code> in backend/.</span></Panel>;
  if (!data) return <Panel>Loading report…</Panel>;

  const { student, headline, journey, root_cause, recovery_history, profile, comparison, next_steps } = data;
  const points = (journey ?? []).map((j) => j.acc);
  const labels = (journey ?? []).map((_, i) => `T${i + 1}`);
  const min = points.length ? Math.max(0, Math.min(...points) - 10) : 0;
  const max = points.length ? Math.min(100, Math.max(...points) + 10) : 100;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>{student?.name ?? `Student #${studentId}`} · Deep Dive</h1>
          <p style={{ margin: 0, color: 'var(--text-dim)' }}>Mathematics · teacher view · live from {(journey ?? []).length} recorded tests</p>
        </div>
        <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
          <button onClick={generateWorksheet} disabled={genLoading} style={btnStyle}>
            {genLoading ? 'Generating…' : '📝 Generate worksheet for this student'}
          </button>
          {genMsg && <span style={{ fontSize: 12, color: `var(--${genMsg.tone})` }}>{genMsg.text}</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
        <StatCard value={`${headline?.current_avg ?? '—'}%`} label="Current avg" />
        <StatCard value={headline?.since_first_delta != null ? `${headline.since_first_delta >= 0 ? '+' : ''}${headline.since_first_delta}%` : '—'} label="Since T1" tone={headline?.since_first_delta >= 0 ? 'good' : 'bad'} />
        <StatCard value={headline?.gaps_found ?? '—'} label="Gaps found" />
        <StatCard value={headline?.gaps_closed ?? '—'} label="Closed" tone="good" />
        <StatCard value={headline?.percentile != null ? `${headline.percentile}th` : '—'} label="Percentile" tone="brand" />
      </div>

      {points.length > 0 && (
        <Panel title="📈 The Journey">
          <LineChart points={points} labels={labels} min={min} max={max} />
        </Panel>
      )}

      {root_cause?.tree?.length > 0 && (
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

      <Panel title="🛠 Weak Areas · Teacher Overrides">
        {waErr && <span style={{ color: 'var(--bad)' }}>⚠️ {waErr}</span>}
        {!waErr && !weakAreas && <span style={{ color: 'var(--text-dim)' }}>Loading…</span>}
        {weakAreas && weakAreas.length === 0 && <span style={{ color: 'var(--text-dim)' }}>No weak areas on record for this student.</span>}
        {weakAreas && weakAreas.length > 0 && (
          <div style={{ display: 'grid', gap: 10 }}>
            {weakAreas.map((wa) => {
              const o = overrides[wa.id] || { status: '', reason: '' };
              return (
                <div key={wa.id} style={{ padding: '10px 12px', background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{wa.label ?? wa.wiswits_id}</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: 12, marginLeft: 8 }}>
                        {wa.accuracy}% · {wa.severity} · currently {wa.status}{!!wa.is_root_cause && ' · 🚨 root cause'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={o.status} onChange={(e) => setOverride(wa.id, { status: e.target.value })} style={selectStyle}>
                      <option value="">Override status…</option>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input
                      placeholder="Reason (required)"
                      value={o.reason}
                      onChange={(e) => setOverride(wa.id, { reason: e.target.value })}
                      style={{ ...selectStyle, flex: 1, minWidth: 180 }}
                    />
                    <button onClick={() => submitOverride(wa)} disabled={!!overrideLoading[wa.id]} style={btnStyleSm}>
                      {overrideLoading[wa.id] ? 'Saving…' : 'Apply'}
                    </button>
                  </div>
                  {overrideMsg[wa.id] && (
                    <div style={{ marginTop: 6, fontSize: 12, color: `var(--${overrideMsg[wa.id].tone})` }}>{overrideMsg[wa.id].text}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {recovery_history?.length > 0 && (
        <Panel title="🔄 Recovery History">
          <div style={{ display: 'grid', gap: 8 }}>
            {recovery_history.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                <span>{c.label}</span>
                <span style={{ color: 'var(--text-dim)' }}>{c.from}% → {c.to != null ? `${c.to}%` : '?'}</span>
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
              {(profile.strengths ?? []).slice(0, 2).map((s) => (
                <div key={s.wiswits_id} style={{ fontSize: 12, color: 'var(--good)' }}>🏆 {s.label} · {s.accuracy}%</div>
              ))}
            </div>
          </Panel>

          <Panel title="Error Signature">
            <div style={{ display: 'grid', gap: 8 }}>
              {(profile.error_signature ?? []).map((e) => (
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
              <tr>{['', 'Student', 'Class', 'Topper'].map((h) => <th key={h} style={{ textAlign: h ? 'right' : 'left', color: 'var(--text-faint)', padding: '4px 8px', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '6px 8px' }}>Overall</td>
                <td style={tdr}>{comparison.my?.accuracy}%</td>
                <td style={tdr}>{comparison.peers?.class_avg ?? '—'}%</td>
                <td style={tdr}>{comparison.peers?.topper ?? '—'}%</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 14, padding: 12, background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
              Percentile: {comparison.position?.percentile}th · Band: {comparison.position?.band?.replace('_', ' ')}
            </div>
            <Bar pct={comparison.position?.percentile ?? 0} />
          </div>
          <div style={{ marginTop: 12, display: 'grid', gap: 4 }}>
            {(comparison.narrative ?? []).map((l, i) => <div key={i} style={{ fontSize: 13 }}>{l}</div>)}
          </div>
        </Panel>
      )}

      {next_steps?.length > 0 && (
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
const selectStyle = { padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', fontSize: 13 };
const btnStyle = { padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 600, cursor: 'pointer' };
const btnStyleSm = { padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' };
