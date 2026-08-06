/* Teacher Insights — four panels over the /insights/* endpoints.
   GET /insights/reteach?test_id=          → {reteach:[{headline, misconception, action:{reteach_text}}]}
   GET /insights/attention                 → {students:[{student_id,name,wiswits_id,label,severity,accuracy,cycles_run}]}
   GET /insights/question-quality          → {flags:[...], note} — likely empty; render note honestly
   GET /insights/qbank-gaps                → {gaps:[...], note}  — likely empty; render note honestly */

import { useEffect, useState } from 'react';
import { Panel } from '../components/ui.jsx';

const HEADERS = { 'x-role': 'teacher', 'x-org-id': '9001' };
const SEVERITY_TONE = { critical: 'bad', weak: 'bad', borderline: 'warn', strong: 'good', mastered: 'good' };

export default function TeacherInsights() {
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>💡 Insights</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Reteach signals, attention list, question quality and QBank coverage.</p>
      </div>
      <ReteachPanel />
      <AttentionPanel />
      <QuestionQualityPanel />
      <QBankGapsPanel />
    </div>
  );
}

function ReteachPanel() {
  const [testId, setTestId] = useState('20');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  function load() {
    const tid = Number(testId);
    if (!tid) return;
    setLoading(true); setErr(null);
    fetch(`/api/pl/insights/reteach?test_id=${tid}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((d) => setData(d.reteach ?? []))
      .catch((e) => setErr(e.detail || e.error || 'failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Panel
      title="🔁 Reteach signals"
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={testId} onChange={(e) => setTestId(e.target.value)} placeholder="test_id" style={{ ...selectStyle, width: 90 }} />
          <button onClick={load} disabled={loading} style={btnStyleSm}>{loading ? 'Loading…' : 'Load'}</button>
        </div>
      }
    >
      {err && <span style={{ color: 'var(--bad)' }}>⚠️ {err}</span>}
      {!err && data && data.length === 0 && (
        <span style={{ color: 'var(--text-dim)' }}>No reteach signal for test #{testId} — this endpoint returned an empty list live for every test_id tried during dev (1, 2, 3, 5, 10, 15, 20).</span>
      )}
      {data && data.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {data.map((r, i) => (
            <div key={i} style={{ padding: 12, background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600 }}>{r.headline}</div>
              {r.misconception && <div style={{ fontSize: 13, color: 'var(--warn)', marginTop: 4 }}>⚠️ {r.misconception}</div>}
              {r.action?.reteach_text && <div style={{ fontSize: 13, marginTop: 6 }}>💬 {r.action.reteach_text}</div>}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function AttentionPanel() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch('/api/pl/insights/attention', { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((d) => setData(d.students ?? []))
      .catch((e) => setErr(e.detail || e.error || 'failed to load'));
  }, []);

  return (
    <Panel title="🚨 Needs attention">
      {err && <span style={{ color: 'var(--bad)' }}>⚠️ {err}</span>}
      {!err && !data && <span style={{ color: 'var(--text-dim)' }}>Loading…</span>}
      {data && data.length === 0 && <span style={{ color: 'var(--text-dim)' }}>Nobody flagged right now.</span>}
      {data && data.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          {data.slice(0, 30).map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
              <span>{s.name ?? `#${s.student_id}`} <span style={{ color: 'var(--text-faint)' }}>· {s.label ?? s.wiswits_id}</span></span>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, color: `var(--${SEVERITY_TONE[s.severity] || 'text-dim'})`, background: `var(--${SEVERITY_TONE[s.severity] || 'text-dim'}-soft)` }}>{s.severity}</span>
                <span style={{ color: 'var(--text-dim)' }}>{s.accuracy}%</span>
                <span style={{ color: 'var(--text-faint)' }}>{s.cycles_run ?? 0} cycles</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function QuestionQualityPanel() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch('/api/pl/insights/question-quality', { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then(setData)
      .catch((e) => setErr(e.detail || e.error || 'failed to load'));
  }, []);

  return (
    <Panel title="🔍 Question quality">
      {err && <span style={{ color: 'var(--bad)' }}>⚠️ {err}</span>}
      {!err && !data && <span style={{ color: 'var(--text-dim)' }}>Loading…</span>}
      {data && (data.flags ?? []).length === 0 && (
        <span style={{ color: 'var(--text-dim)' }}>{data.note ?? 'No flagged questions.'}</span>
      )}
      {data && (data.flags ?? []).length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          {data.flags.map((f, i) => (
            <div key={i} style={{ padding: 10, background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>{JSON.stringify(f)}</div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function QBankGapsPanel() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch('/api/pl/insights/qbank-gaps', { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then(setData)
      .catch((e) => setErr(e.detail || e.error || 'failed to load'));
  }, []);

  return (
    <Panel title="📦 QBank gaps">
      {err && <span style={{ color: 'var(--bad)' }}>⚠️ {err}</span>}
      {!err && !data && <span style={{ color: 'var(--text-dim)' }}>Loading…</span>}
      {data && (data.gaps ?? []).length === 0 && (
        <span style={{ color: 'var(--text-dim)' }}>{data.note ?? 'No shortages found.'}</span>
      )}
      {data && (data.gaps ?? []).length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          {data.gaps.map((g, i) => (
            <div key={i} style={{ padding: 10, background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>{JSON.stringify(g)}</div>
          ))}
        </div>
      )}
    </Panel>
  );
}

const selectStyle = { padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--panel-2)', color: 'var(--text)', fontSize: 13 };
const btnStyleSm = { padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' };
