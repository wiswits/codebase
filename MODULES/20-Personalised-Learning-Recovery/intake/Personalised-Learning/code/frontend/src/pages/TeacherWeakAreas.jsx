/* ⭐ Teacher Weak Areas — class heatmap + filterable weak-area list + severity summary.
   GET /analytics/class/heatmap?limit=32  → HeatmapGrid
   GET /weak-areas?severity=&status=&limit= → filterable list, per-row "Generate worksheet"
   GET /weak-areas/heatmap?scope=class → topic × severity-band StackedBar summary */

import { useEffect, useState } from 'react';
import { Panel } from '../components/ui.jsx';
import HeatmapGrid from '../components/HeatmapGrid.jsx';
import StackedBar from '../components/StackedBar.jsx';

const HEADERS = { 'x-role': 'teacher', 'x-org-id': '9001' };

const SEVERITY_TONE = { critical: 'bad', weak: 'bad', borderline: 'warn', strong: 'good', mastered: 'good' };
const STATUS_TONE = { open: 'bad', in_recovery: 'warn', closed: 'good', escalated: 'bad' };

export default function TeacherWeakAreas() {
  const [heatmap, setHeatmap] = useState(null);
  const [heatmapErr, setHeatmapErr] = useState(null);

  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [list, setList] = useState(null);
  const [listErr, setListErr] = useState(null);

  const [summary, setSummary] = useState(null);

  const [toasts, setToasts] = useState({}); // weak_area id -> message
  const [genLoading, setGenLoading] = useState({});

  useEffect(() => {
    fetch('/api/pl/analytics/class/heatmap?limit=32', { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then(setHeatmap)
      .catch((e) => setHeatmapErr(e.detail || e.error || 'failed to load heatmap'));

    fetch('/api/pl/weak-areas/heatmap?scope=class', { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setSummary)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (severity) qs.set('severity', severity);
    if (status) qs.set('status', status);
    qs.set('limit', '50');
    fetch(`/api/pl/weak-areas?${qs.toString()}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((d) => setList(d.weak_areas ?? []))
      .catch((e) => setListErr(e.detail || e.error || 'failed to load weak areas'));
  }, [severity, status]);

  async function generateWorksheet(wa) {
    setGenLoading((s) => ({ ...s, [wa.id]: true }));
    setToasts((s) => ({ ...s, [wa.id]: null }));
    try {
      const res = await fetch('/api/pl/worksheets/generate', {
        method: 'POST',
        headers: { ...HEADERS, 'content-type': 'application/json' },
        body: JSON.stringify({ student_id: wa.student_id, opts: {} }),
      });
      const d = await res.json();
      if (d?.skip_worksheet) {
        setToasts((s) => ({ ...s, [wa.id]: { tone: 'warn', text: `💬 Coaching instead: ${d.message || d.reason || 'no worksheet needed'}` } }));
      } else if (res.ok && d?.id) {
        setToasts((s) => ({ ...s, [wa.id]: { tone: 'good', text: `✅ Worksheet #${d.id} generated (${d.total_questions ?? '?'} Qs, ${d.strategy || '—'})` } }));
      } else {
        setToasts((s) => ({ ...s, [wa.id]: { tone: 'bad', text: `⚠️ ${d?.error || 'generation failed'}` } }));
      }
    } catch (e) {
      setToasts((s) => ({ ...s, [wa.id]: { tone: 'bad', text: `⚠️ ${e.message}` } }));
    } finally {
      setGenLoading((s) => ({ ...s, [wa.id]: false }));
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>🔥 Class Weak Areas</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Student × topic accuracy grid, plus the live weak-area register.</p>
      </div>

      <Panel title="Students × Topics — accuracy">
        {heatmapErr && <span style={{ color: 'var(--bad)' }}>⚠️ {heatmapErr}</span>}
        {!heatmapErr && !heatmap && <span style={{ color: 'var(--text-dim)' }}>Loading…</span>}
        {heatmap && <HeatmapGrid students={heatmap.students ?? []} topics={heatmap.topics ?? []} cells={heatmap.cells ?? []} />}
      </Panel>

      {summary && (
        <Panel title="Severity distribution by topic">
          <div style={{ display: 'grid', gap: 14 }}>
            {(summary.matrix ?? []).map((m) => (
              <div key={m.wiswits_id}>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>{m.label}</div>
                <StackedBar
                  segments={(summary.bands ?? []).map((b) => ({
                    label: b,
                    value: m.counts?.[b] ?? 0,
                    tone: SEVERITY_TONE[b] || 'text-dim',
                  }))}
                  height={16}
                />
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title="Weak areas"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={selectStyle}>
              <option value="">All severities</option>
              {['critical', 'weak', 'borderline', 'strong', 'mastered'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
              <option value="">All statuses</option>
              {['open', 'in_recovery', 'closed', 'escalated'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        }
      >
        {listErr && <span style={{ color: 'var(--bad)' }}>⚠️ {listErr}</span>}
        {!listErr && !list && <span style={{ color: 'var(--text-dim)' }}>Loading…</span>}
        {list && list.length === 0 && <span style={{ color: 'var(--text-dim)' }}>No weak areas match this filter.</span>}
        {list && list.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            {list.map((wa) => (
              <div key={wa.id} style={{ padding: '10px 12px', background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>{wa.student_name ?? `#${wa.student_id}`}</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{wa.label ?? wa.wiswits_id}</span>
                    <Badge tone={SEVERITY_TONE[wa.severity] || 'text-dim'} text={wa.severity} />
                    <Badge tone={STATUS_TONE[wa.status] || 'text-dim'} text={wa.status} />
                    {!!wa.is_root_cause && <Badge tone="bad" text="🚨 root cause" />}
                    <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>{wa.accuracy}%</span>
                  </div>
                  <button
                    onClick={() => generateWorksheet(wa)}
                    disabled={!!genLoading[wa.id]}
                    style={btnStyle}
                  >
                    {genLoading[wa.id] ? 'Generating…' : 'Generate worksheet'}
                  </button>
                </div>
                {toasts[wa.id] && (
                  <div style={{ marginTop: 8, fontSize: 12, color: `var(--${toasts[wa.id].tone})` }}>{toasts[wa.id].text}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Badge({ tone, text }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, padding: '2px 8px', borderRadius: 999, color: `var(--${tone})`, background: `var(--${tone}-soft)` }}>
      {text}
    </span>
  );
}

const selectStyle = { padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--panel-2)', color: 'var(--text)', fontSize: 13 };
const btnStyle = { padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' };
