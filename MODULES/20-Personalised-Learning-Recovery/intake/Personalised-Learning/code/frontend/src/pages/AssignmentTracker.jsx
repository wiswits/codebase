/* Assignment tracker — list assignments with live delivery-funnel status,
   plus a mini creation form for class / students / auto_group targeting.

   Live from:
   - GET  /assignments                    → { assignments: [...] }
   - GET  /assignments/:id/status         → { total, assigned, started, submitted, evaluated, absent, excused, students:[...] }
   - POST /assignments                    → { id, test_id, target_type, student_count, student_ids }
   - POST /assignments/preview-group      → { count, students:[{id,name,severity,accuracy}] }
   - POST /assignments/auto-group         → { id, test_id, target_type, matched_count, student_ids }

   Note: target_type='class' has no real roster table in this schema slice —
   the backend materializes it against a slice of the seeded demo student
   range (900001-900500), sized off target_json.count (default 30). */

import { useEffect, useState } from 'react';
import { Panel } from '../components/ui.jsx';

const HEADERS_JSON = { 'x-role': 'teacher', 'x-org-id': '9001', 'Content-Type': 'application/json' };
const HEADERS = { 'x-role': 'teacher', 'x-org-id': '9001' };

const SEVERITIES = ['critical', 'weak', 'borderline'];

export default function AssignmentTracker() {
  const [assignments, setAssignments] = useState(null);
  const [err, setErr] = useState(null);
  const [statusById, setStatusById] = useState({});

  const [testId, setTestId] = useState('');
  const [targetType, setTargetType] = useState('students');
  const [studentIdsText, setStudentIdsText] = useState('');
  const [classCount, setClassCount] = useState(30);
  const [weakIn, setWeakIn] = useState('MATH10C01T01');
  const [severity, setSeverity] = useState(['critical', 'weak']);
  const [preview, setPreview] = useState(null);
  const [previewErr, setPreviewErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [createErr, setCreateErr] = useState(null);
  const [createOk, setCreateOk] = useState(null);

  function load() {
    setErr(null);
    fetch('/api/pl/assignments', { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((j) => {
        const list = j.assignments || [];
        setAssignments(list);
        // fetch status for all rows on load (list is small in this demo)
        list.forEach((a) => {
          fetch(`/api/pl/assignments/${a.id}/status`, { headers: HEADERS })
            .then((r) => (r.ok ? r.json() : null))
            .then((s) => { if (s) setStatusById((prev) => ({ ...prev, [a.id]: s })); })
            .catch(() => {});
        });
      })
      .catch((e) => setErr(e?.error || e?.detail || 'failed to load'));
  }

  useEffect(load, []);

  function toggleSeverity(s) {
    setSeverity((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  async function handlePreview() {
    setPreviewErr(null);
    setPreview('loading');
    try {
      const res = await fetch('/api/pl/assignments/preview-group', {
        method: 'POST', headers: HEADERS_JSON,
        body: JSON.stringify({ rule: { weak_in: weakIn, severity } }),
      });
      const j = await res.json();
      if (!res.ok) throw j;
      setPreview(j);
    } catch (e) {
      setPreview(null);
      setPreviewErr(e?.error || e?.detail || 'preview failed');
    }
  }

  async function handleConfirmAutoGroup() {
    if (!testId) { setCreateErr('test_id is required'); return; }
    setBusy(true); setCreateErr(null); setCreateOk(null);
    try {
      const res = await fetch('/api/pl/assignments/auto-group', {
        method: 'POST', headers: HEADERS_JSON,
        body: JSON.stringify({ test_id: Number(testId), rule: { weak_in: weakIn, severity } }),
      });
      const j = await res.json();
      if (!res.ok) throw j;
      setCreateOk(`Created assignment #${j.id} — matched ${j.matched_count} students.`);
      setPreview(null);
      load();
    } catch (e) {
      setCreateErr(e?.error || e?.detail || 'failed to create');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreatePlain() {
    if (!testId) { setCreateErr('test_id is required'); return; }
    setBusy(true); setCreateErr(null); setCreateOk(null);
    let target_json = {};
    if (targetType === 'students') {
      const ids = studentIdsText.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
      if (!ids.length) { setCreateErr('at least one student_id is required'); setBusy(false); return; }
      target_json = { student_ids: ids };
    } else if (targetType === 'class') {
      target_json = { count: Number(classCount) || 30 };
    }
    try {
      const res = await fetch('/api/pl/assignments', {
        method: 'POST', headers: HEADERS_JSON,
        body: JSON.stringify({ test_id: Number(testId), target_type: targetType, target_json }),
      });
      const j = await res.json();
      if (!res.ok) throw j;
      setCreateOk(`Created assignment #${j.id} — ${j.student_count} students targeted.`);
      load();
    } catch (e) {
      setCreateErr(e?.error || e?.detail || 'failed to create');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>Assignment Tracker</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Assignments and their live delivery-funnel status.</p>
      </div>

      <Panel title="＋ New Assignment">
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 4, maxWidth: 200 }}>
            <span style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Test ID</span>
            <input style={inputStyle} type="number" value={testId} onChange={(e) => setTestId(e.target.value)} placeholder="e.g. 20" />
          </label>

          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
            {['class', 'students', 'auto_group'].map((t) => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="radio" name="target_type" checked={targetType === t} onChange={() => setTargetType(t)} />
                {t}
              </label>
            ))}
          </div>

          {targetType === 'students' && (
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Student IDs (comma-separated)</span>
              <input style={inputStyle} value={studentIdsText} onChange={(e) => setStudentIdsText(e.target.value)} placeholder="900001, 900002, 900003" />
            </label>
          )}

          {targetType === 'class' && (
            <label style={{ display: 'grid', gap: 4, maxWidth: 200 }}>
              <span style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Count (demo roster slice)</span>
              <input style={inputStyle} type="number" value={classCount} onChange={(e) => setClassCount(e.target.value)} />
            </label>
          )}

          {targetType === 'auto_group' && (
            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ display: 'grid', gap: 4, maxWidth: 240 }}>
                <span style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Weak in (wiswits_id)</span>
                <input style={inputStyle} value={weakIn} onChange={(e) => setWeakIn(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: 14, fontSize: 13 }}>
                {SEVERITIES.map((s) => (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={severity.includes(s)} onChange={() => toggleSeverity(s)} />
                    {s}
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={btnSmall} onClick={handlePreview} type="button">Preview group</button>
                {preview && preview !== 'loading' && (
                  <button style={btnStyle} onClick={handleConfirmAutoGroup} disabled={busy} type="button">
                    {busy ? 'Creating…' : `Confirm — assign to ${preview.count} students`}
                  </button>
                )}
              </div>
              {preview === 'loading' && <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Matching…</div>}
              {previewErr && <div style={{ fontSize: 12, color: 'var(--bad)' }}>⚠️ {previewErr}</div>}
              {preview && preview !== 'loading' && (
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {preview.count} students matched.
                  {preview.count > 0 && (
                    <div style={{ marginTop: 6, maxHeight: 140, overflowY: 'auto', display: 'grid', gap: 2 }}>
                      {preview.students.map((s) => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{s.name}</span>
                          <span style={{ color: 'var(--text-faint)' }}>{s.severity} · {s.accuracy}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {targetType !== 'auto_group' && (
            <div>
              <button style={btnStyle} onClick={handleCreatePlain} disabled={busy} type="button">{busy ? 'Creating…' : 'Create Assignment'}</button>
            </div>
          )}

          {createErr && <div style={{ color: 'var(--bad)', fontSize: 13 }}>⚠️ {String(createErr)}</div>}
          {createOk && <div style={{ color: 'var(--good)', fontSize: 13 }}>✅ {createOk}</div>}
        </div>
      </Panel>

      <Panel title="Assignments">
        {err && <span style={{ color: 'var(--bad)' }}>⚠️ {String(err)}</span>}
        {!err && assignments == null && <span style={{ color: 'var(--text-faint)' }}>Loading…</span>}
        {!err && assignments != null && assignments.length === 0 && <span style={{ color: 'var(--text-faint)' }}>No assignments yet.</span>}
        {!err && assignments != null && assignments.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['ID', 'Test', 'Target', 'Students', 'Status', 'Delivery funnel'].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const s = statusById[a.id];
                  return (
                    <tr key={a.id}>
                      <td style={td}>{a.id}</td>
                      <td style={td}>{a.test_title} <span style={{ color: 'var(--text-faint)' }}>#{a.test_id}</span></td>
                      <td style={td}>{a.target_type}</td>
                      <td style={td}>{a.student_count}</td>
                      <td style={{ ...td, color: a.status === 'open' ? 'var(--good)' : 'var(--text-dim)' }}>{a.status}</td>
                      <td style={td}>
                        {s ? (
                          <span style={{ color: 'var(--text-dim)' }}>
                            assigned {s.assigned} · started {s.started} · submitted {s.submitted} · evaluated {s.evaluated}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-faint)' }}>…</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

const th = { textAlign: 'left', fontSize: 12, color: 'var(--text-faint)', fontWeight: 600, padding: '8px 10px', textTransform: 'uppercase', letterSpacing: 0.5 };
const td = { padding: '10px', fontSize: 13, borderTop: '1px solid var(--border)' };

const inputStyle = {
  background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  color: 'var(--text)', padding: '8px 10px', fontSize: 13, width: '100%',
};

const btnStyle = {
  background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
  padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

const btnSmall = {
  background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  padding: '6px 12px', fontSize: 12, cursor: 'pointer',
};
