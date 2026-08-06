/* Student Worksheets — route /student/pl/worksheets.
   GET /worksheets?student= → {worksheets:[{id,student_id,strategy,total_questions,
     est_time_min,status,generated_at,assigned_at,attempted_at,score,target_wiswits_ids}]}
   GET /worksheets/:id/pdf?solutions=false → {content:{worksheet_id,student_id,strategy,
     target_wiswits_ids,total_questions,est_time_min,generation_reason,questions:[
     {id,wiswits_id,difficulty,bloom,marks,stem}]}, pdf_path}
     (no `solution` field when solutions=false — this is the student's working copy)
   POST /worksheets/:id/attempt {score} → updated worksheet row (status becomes "attempted")
   NOTE: worksheets list query param is `student=` (bare, no _id suffix) — differs from
   /my/tests and /widgets/* which use `student_id=`. Verified live. */

import { useEffect, useState } from 'react';
import { Panel } from '../components/ui.jsx';

const STUDENT_ID = 900001;
const HEADERS = { 'x-role': 'student', 'x-org-id': '9001', 'content-type': 'application/json' };

const STATUS_TONE = { generated: 'brand', assigned: 'warn', attempted: 'good' };

export default function StudentWorksheets() {
  const [list, setList] = useState(null);
  const [err, setErr] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailErr, setDetailErr] = useState(null);
  const [scoreInput, setScoreInput] = useState({});
  const [saveMsg, setSaveMsg] = useState({});

  useEffect(() => { loadList(); }, []);

  function loadList() {
    fetch(`/api/pl/worksheets?student=${STUDENT_ID}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((d) => setList(d.worksheets ?? []))
      .catch((e) => setErr(e?.detail || e?.error || 'failed to load worksheets'));
  }

  function view(id) {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    setDetail(null);
    setDetailErr(null);
    fetch(`/api/pl/worksheets/${id}/pdf?solutions=false`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((d) => setDetail(d.content))
      .catch((e) => setDetailErr(e?.detail || e?.error || 'failed to load worksheet'));
  }

  async function recordScore(id) {
    const score = Number(scoreInput[id]);
    if (Number.isNaN(score)) return;
    setSaveMsg((m) => ({ ...m, [id]: null }));
    try {
      const res = await fetch(`/api/pl/worksheets/${id}/attempt`, { method: 'POST', headers: HEADERS, body: JSON.stringify({ score }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMsg((m) => ({ ...m, [id]: { tone: 'bad', text: `⚠️ ${body?.detail || body?.error || 'failed to save'}` } }));
      } else {
        setSaveMsg((m) => ({ ...m, [id]: { tone: 'good', text: `✅ Saved — score ${body.score ?? score}.` } }));
        loadList();
      }
    } catch {
      setSaveMsg((m) => ({ ...m, [id]: { tone: 'bad', text: '⚠️ Network error — try again.' } }));
    }
  }

  if (err) return <Panel><span style={{ color: 'var(--bad)' }}>⚠️ {err}</span></Panel>;
  if (!list) return <Panel>Loading worksheets…</Panel>;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>📄 My Worksheets</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Targeted practice generated from your weak areas.</p>
      </div>

      {list.length === 0 && (
        <Panel><div style={{ color: 'var(--text-faint)' }}>No worksheets yet — get one from your weak areas page.</div></Panel>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        {list.map((w) => (
          <Panel key={w.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  Worksheet #{w.id} · {(w.target_wiswits_ids ?? []).join(', ') || w.strategy}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                  {w.total_questions} questions · ~{w.est_time_min} min
                  {w.score != null && ` · score ${w.score}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: `var(--${STATUS_TONE[w.status] || 'text-dim'})`, textTransform: 'uppercase', fontWeight: 600 }}>{w.status}</span>
                <button onClick={() => view(w.id)} style={{ minHeight: 36, padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--panel-2)', color: 'var(--text)', cursor: 'pointer' }}>
                  {openId === w.id ? 'Hide' : 'View'}
                </button>
              </div>
            </div>

            {openId === w.id && (
              <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                {detailErr && <div style={{ color: 'var(--bad)' }}>⚠️ {detailErr}</div>}
                {!detail && !detailErr && <div style={{ color: 'var(--text-faint)' }}>Loading…</div>}
                {detail && (
                  <>
                    {detail.generation_reason && (
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>💡 {detail.generation_reason}</div>
                    )}
                    <div style={{ display: 'grid', gap: 10 }}>
                      {(detail.questions ?? []).map((q, i) => (
                        <div key={`${q.id}-${i}`} style={{ padding: '10px 12px', background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                          <span style={{ color: 'var(--text-faint)', marginRight: 6 }}>Q{i + 1}.</span>
                          {q.stem}
                          <span style={{ color: 'var(--text-faint)', marginLeft: 8, fontSize: 11 }}>({q.difficulty} · {q.marks} marks)</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>✅ I finished — record my score:</span>
                      <input
                        type="number"
                        min={0}
                        placeholder="score"
                        value={scoreInput[w.id] ?? ''}
                        onChange={(e) => setScoreInput((s) => ({ ...s, [w.id]: e.target.value }))}
                        style={{ width: 90, padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)' }}
                      />
                      <button
                        onClick={() => recordScore(w.id)}
                        style={{ minHeight: 36, padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--good)', color: '#04140a', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Save score
                      </button>
                      {saveMsg[w.id] && <span style={{ fontSize: 12, color: `var(--${saveMsg[w.id].tone})` }}>{saveMsg[w.id].text}</span>}
                    </div>
                  </>
                )}
              </div>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
}
