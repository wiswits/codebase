/* Teacher Worksheets — list + bulk generate + printable view.
   GET /worksheets?student=&status=
   POST /worksheets/generate-bulk {student_ids:[...], opts:{}} → {generated, skipped_coaching, worksheets:[...]}
   GET /worksheets/:id/pdf?solutions=true → {content:{...questions with stem/solution...}, pdf_path:null}
   POST /worksheets/:id/assign
   POST /worksheets/:id/regenerate */

import { useEffect, useState } from 'react';
import { Panel } from '../components/ui.jsx';

const HEADERS = { 'x-role': 'teacher', 'x-org-id': '9001' };

const STATUS_TONE = { generated: 'brand', assigned: 'warn', attempted: 'good' };

export default function TeacherWorksheets() {
  const [status, setStatus] = useState('');
  const [list, setList] = useState(null);
  const [listErr, setListErr] = useState(null);

  const [bulkInput, setBulkInput] = useState('900303, 900001, 900007');
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [viewing, setViewing] = useState(null); // worksheet id being viewed
  const [viewData, setViewData] = useState(null);
  const [viewErr, setViewErr] = useState(null);

  const [rowMsg, setRowMsg] = useState({}); // worksheet id -> {tone, text}
  const [rowLoading, setRowLoading] = useState({});

  function loadList() {
    const qs = new URLSearchParams();
    if (status) qs.set('status', status);
    setList(null); setListErr(null);
    fetch(`/api/pl/worksheets?${qs.toString()}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((d) => setList(d.worksheets ?? []))
      .catch((e) => setListErr(e.detail || e.error || 'failed to load worksheets'));
  }

  useEffect(loadList, [status]);

  async function bulkGenerate() {
    const ids = bulkInput.split(',').map((s) => Number(s.trim())).filter(Boolean);
    if (!ids.length) return;
    setBulkLoading(true); setBulkResult(null);
    try {
      const res = await fetch('/api/pl/worksheets/generate-bulk', {
        method: 'POST',
        headers: { ...HEADERS, 'content-type': 'application/json' },
        body: JSON.stringify({ student_ids: ids, opts: {} }),
      });
      const d = await res.json();
      setBulkResult(res.ok ? d : { error: d?.error || 'bulk generation failed' });
      loadList();
    } catch (e) {
      setBulkResult({ error: e.message });
    } finally {
      setBulkLoading(false);
    }
  }

  async function viewWorksheet(id) {
    setViewing(id); setViewData(null); setViewErr(null);
    try {
      const res = await fetch(`/api/pl/worksheets/${id}/pdf?solutions=true`, { headers: HEADERS });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || 'failed to load worksheet');
      setViewData(d.content ?? d);
    } catch (e) {
      setViewErr(e.message);
    }
  }

  async function assign(id) {
    setRowLoading((s) => ({ ...s, [id]: true }));
    try {
      const res = await fetch(`/api/pl/worksheets/${id}/assign`, { method: 'POST', headers: { ...HEADERS, 'content-type': 'application/json' }, body: '{}' });
      const d = await res.json();
      setRowMsg((s) => ({ ...s, [id]: { tone: res.ok ? 'good' : 'bad', text: res.ok ? '✅ Assigned' : `⚠️ ${d?.error || 'failed'}` } }));
      loadList();
    } catch (e) {
      setRowMsg((s) => ({ ...s, [id]: { tone: 'bad', text: `⚠️ ${e.message}` } }));
    } finally {
      setRowLoading((s) => ({ ...s, [id]: false }));
    }
  }

  async function regenerate(id) {
    setRowLoading((s) => ({ ...s, [id]: true }));
    try {
      const res = await fetch(`/api/pl/worksheets/${id}/regenerate`, { method: 'POST', headers: { ...HEADERS, 'content-type': 'application/json' }, body: '{}' });
      const d = await res.json();
      setRowMsg((s) => ({ ...s, [id]: { tone: res.ok ? 'good' : 'bad', text: res.ok ? '🔄 Regenerated' : `⚠️ ${d?.error || 'failed'}` } }));
      loadList();
    } catch (e) {
      setRowMsg((s) => ({ ...s, [id]: { tone: 'bad', text: `⚠️ ${e.message}` } }));
    } finally {
      setRowLoading((s) => ({ ...s, [id]: false }));
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>📝 Worksheets</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Generate, assign and print targeted practice worksheets.</p>
      </div>

      <Panel title="Bulk generate">
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>Comma-separated student IDs</label>
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            rows={2}
            style={{ padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--panel-2)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, resize: 'vertical' }}
          />
          <div>
            <button onClick={bulkGenerate} disabled={bulkLoading} style={btnStyle}>
              {bulkLoading ? 'Generating…' : 'Generate for all'}
            </button>
          </div>
          {bulkResult && !bulkResult.error && (
            <div style={{ fontSize: 13, padding: 10, background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)' }}>
              ✅ Generated: <strong style={{ color: 'var(--good)' }}>{bulkResult.generated ?? 0}</strong> ·
              💬 Skipped (coaching instead): <strong style={{ color: 'var(--warn)' }}>{bulkResult.skipped_coaching ?? 0}</strong>
            </div>
          )}
          {bulkResult?.error && <div style={{ fontSize: 13, color: 'var(--bad)' }}>⚠️ {bulkResult.error}</div>}
        </div>
      </Panel>

      <Panel
        title="All worksheets"
        action={
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
            <option value="">All statuses</option>
            {['generated', 'assigned', 'attempted'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      >
        {listErr && <span style={{ color: 'var(--bad)' }}>⚠️ {listErr}</span>}
        {!listErr && !list && <span style={{ color: 'var(--text-dim)' }}>Loading…</span>}
        {list && list.length === 0 && <span style={{ color: 'var(--text-dim)' }}>No worksheets yet.</span>}
        {list && list.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            {list.map((w) => (
              <div key={w.id} style={{ padding: '10px 12px', background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>#{w.id} · student {w.student_id}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{(w.target_wiswits_ids ?? []).join(', ')}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, color: `var(--${STATUS_TONE[w.status] || 'text-dim'})`, background: `var(--${STATUS_TONE[w.status] || 'text-dim'}-soft)` }}>{w.status}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{w.total_questions ?? 0} Qs · {w.est_time_min ?? 0} min · {w.strategy}</span>
                    {w.score != null && <span style={{ fontSize: 12, color: 'var(--good)' }}>score {w.score}%</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => viewWorksheet(w.id)} style={btnStyleSm}>View</button>
                    <button onClick={() => assign(w.id)} disabled={!!rowLoading[w.id]} style={btnStyleSm}>Assign</button>
                    <button onClick={() => regenerate(w.id)} disabled={!!rowLoading[w.id]} style={btnStyleSm}>Regenerate</button>
                  </div>
                </div>
                {rowMsg[w.id] && <div style={{ marginTop: 6, fontSize: 12, color: `var(--${rowMsg[w.id].tone})` }}>{rowMsg[w.id].text}</div>}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {viewing && (
        <Panel
          title={`Worksheet #${viewing} — printable`}
          action={<button onClick={() => window.print()} style={btnStyleSm}>🖨 Print</button>}
        >
          {viewErr && <span style={{ color: 'var(--bad)' }}>⚠️ {viewErr}</span>}
          {!viewErr && !viewData && <span style={{ color: 'var(--text-dim)' }}>Loading…</span>}
          {viewData && (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                Strategy: {viewData.strategy} · Targets: {(viewData.target_wiswits_ids ?? []).join(', ')} · {viewData.total_questions ?? (viewData.questions ?? []).length} questions · ~{viewData.est_time_min ?? '—'} min
              </div>
              {viewData.generation_reason && (
                <div style={{ fontSize: 13, padding: 10, background: 'var(--brand-soft)', borderRadius: 'var(--radius-sm)' }}>💡 {viewData.generation_reason}</div>
              )}
              <div style={{ display: 'grid', gap: 14 }}>
                {(viewData.questions ?? []).map((q, i) => (
                  <div key={i} style={{ padding: 14, background: '#fff', color: '#111', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Q{i + 1}. {q.stem}</div>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{q.wiswits_id} · {q.difficulty} · {q.bloom} · {q.marks} marks</div>
                    {q.solution != null && (
                      <div style={{ fontSize: 12, color: '#333', borderTop: '1px dashed #ccc', paddingTop: 6, marginTop: 6 }}>
                        <strong>Solution:</strong> {typeof q.solution === 'string' ? q.solution : JSON.stringify(q.solution) || '—'}
                      </div>
                    )}
                  </div>
                ))}
                {(!viewData.questions || viewData.questions.length === 0) && (
                  <span style={{ color: 'var(--text-dim)' }}>No questions on this worksheet.</span>
                )}
              </div>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

const selectStyle = { padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--panel-2)', color: 'var(--text)', fontSize: 13 };
const btnStyle = { padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 600, cursor: 'pointer' };
const btnStyleSm = { padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' };
