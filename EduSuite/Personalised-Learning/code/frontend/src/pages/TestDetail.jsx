/* ⭐ Test Detail — preview, publish/clone/validate/delete, analytics
   (spec: /teacher/pl/tests/:id). */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Panel } from '../components/ui.jsx';
import Histogram from '../components/Histogram.jsx';

const H = { 'x-role': 'teacher', 'x-org-id': '9001' };
const HJSON = { ...H, 'content-type': 'application/json' };

const statusTone = { draft: 'text-dim', ready: 'brand', published: 'good', closed: 'text-faint', archived: 'text-faint' };

export default function TestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [qAnalytics, setQAnalytics] = useState(null);
  const [validation, setValidation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState(null);

  function loadPreview() {
    fetch(`/api/pl/tests/${id}/preview`, { headers: H })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`preview → ${r.status}`))))
      .then(setPreview)
      .catch((e) => setErr(e.message || 'failed to load test'));
  }

  useEffect(() => { loadPreview(); }, [id]);

  useEffect(() => {
    if (!preview) return;
    fetch(`/api/pl/analytics/test/${id}`, { headers: H })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j && j.attempted_count > 0) setAnalytics(j); })
      .catch(() => {});
    fetch(`/api/pl/analytics/test/${id}/questions`, { headers: H })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j && j.questions?.length) setQAnalytics(j.questions); })
      .catch(() => {});
  }, [preview, id]);

  async function doPublish() {
    setBusy(true); setActionErr(null);
    try {
      const res = await fetch(`/api/pl/tests/${id}/publish`, { method: 'POST', headers: H });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'publish failed');
      loadPreview();
    } catch (e) { setActionErr(e.message); } finally { setBusy(false); }
  }

  async function doClone() {
    setBusy(true); setActionErr(null);
    try {
      const res = await fetch(`/api/pl/tests/${id}/clone`, { method: 'POST', headers: H });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'clone failed');
      navigate(`/teacher/pl/tests/${j.id}`);
    } catch (e) { setActionErr(e.message); } finally { setBusy(false); }
  }

  async function doValidate() {
    setBusy(true); setActionErr(null);
    try {
      const res = await fetch(`/api/pl/tests/${id}/validate`, { headers: H });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'validate failed');
      setValidation(j);
    } catch (e) { setActionErr(e.message); } finally { setBusy(false); }
  }

  async function doDelete() {
    if (!window.confirm('Delete this test? This cannot be undone.')) return;
    setBusy(true); setActionErr(null);
    try {
      const res = await fetch(`/api/pl/tests/${id}`, { method: 'DELETE', headers: H });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'delete failed');
      navigate('/teacher/pl/tests');
    } catch (e) { setActionErr(e.message); } finally { setBusy(false); }
  }

  if (err) return <Panel><span style={{ color: 'var(--bad)' }}>⚠️ {err}</span></Panel>;
  if (!preview) return <Panel>Loading test…</Panel>;

  const { test, questions } = preview;
  const canPublish = test.status === 'draft' || test.status === 'ready';

  const bins = qAnalytics ? qAnalytics.map((q) => ({
    label: `Q${q.seq}`,
    count: q.accuracy,
    tone: q.accuracy >= 70 ? 'good' : q.accuracy >= 50 ? 'warn' : 'bad',
  })) : [];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>{test.title}</h1>
          <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: 13 }}>
            {test.type} · {test.mode} · class {test.class_no} · {test.total_questions} questions · {test.total_marks} marks
          </p>
        </div>
        <StatusBadge status={test.status} />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {canPublish && <button onClick={doPublish} disabled={busy} style={btnPrimary}>Publish</button>}
        <button onClick={doClone} disabled={busy} style={btnSecondary}>Clone</button>
        <button onClick={doValidate} disabled={busy} style={btnSecondary}>Validate</button>
        <button onClick={doDelete} disabled={busy} style={btnDanger}>Delete</button>
        <Link to={`/teacher/pl/tests/${id}/analytics`} style={btnLink}>Analytics →</Link>
        <Link to={`/teacher/pl/tests/${id}/distractors`} style={btnLink}>Distractors →</Link>
        <Link to="/teacher/pl/marks" style={btnLink}>Marks Entry →</Link>
      </div>
      {actionErr && <p style={{ color: 'var(--bad)', fontSize: 13, margin: 0 }}>⚠️ {actionErr}</p>}

      {validation && (
        <Panel title="Blueprint Validation">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: validation.sane ? 'var(--good)' : 'var(--bad)' }}>
              {validation.sane ? '✅ Compliant' : '⚠️ Issues found'}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              {validation.question_count} questions · blueprint {validation.has_blueprint ? 'present' : 'absent'}
            </span>
          </div>
          {validation.gaps?.length > 0 && (
            <ul style={{ margin: '10px 0 0', paddingLeft: 20, fontSize: 13, color: 'var(--warn)' }}>
              {validation.gaps.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          )}
        </Panel>
      )}

      {analytics && (
        <Panel title="Test Analytics">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
            {[
              ['Attempted', analytics.attempted_count],
              ['Avg score', `${analytics.avg_score}%`],
              ['Median', `${analytics.median_score}%`],
              ['Std dev', analytics.std_dev],
              ['Topper', `${analytics.topper_score}%`],
              ['Lowest', `${analytics.lowest_score}%`],
            ].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center', background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
          {bins.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Accuracy per question</h3>
              <Histogram bins={bins} />
            </div>
          )}
        </Panel>
      )}

      <Panel title={`Questions (${questions.length})`}>
        {questions.length === 0 && <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>No questions yet.</p>}
        <div style={{ display: 'grid', gap: 14 }}>
          {questions.map((q) => (
            <div key={q.test_question_id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14, background: 'var(--panel-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <span>Q{q.seq} · {q.wiswits_id}</span>
                <span>{q.difficulty} · {q.bloom} · {q.marks} marks</span>
              </div>
              <div style={{ fontSize: 14, marginBottom: 8 }}>{q.stem}</div>
              {q.options?.length > 0 && (
                <div style={{ display: 'grid', gap: 4 }}>
                  {q.options.map((o) => (
                    <div key={o.key} style={{
                      fontSize: 13, padding: '4px 8px', borderRadius: 4,
                      color: o.is_correct ? 'var(--good)' : 'var(--text-dim)',
                      background: o.is_correct ? 'var(--good-soft)' : 'transparent',
                      fontWeight: o.is_correct ? 600 : 400,
                    }}>
                      {o.key}. {o.text}{o.is_correct ? ' ✓' : ''}
                    </div>
                  ))}
                </div>
              )}
              {(!q.options || q.options.length === 0) && q.correct && (
                <div style={{ fontSize: 13, color: 'var(--good)' }}>Correct: {q.correct}</div>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function StatusBadge({ status }) {
  const tone = statusTone[status] || 'text-dim';
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
      textTransform: 'uppercase', letterSpacing: 0.5,
      background: tone === 'text-dim' || tone === 'text-faint' ? 'var(--panel-2)' : `var(--${tone}-soft)`,
      color: `var(--${tone})`,
    }}>
      {status}
    </span>
  );
}

const btnPrimary = { padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const btnSecondary = { padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--panel-2)', color: 'var(--text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const btnDanger = { padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bad)', background: 'var(--bad-soft)', color: 'var(--bad)', fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const btnLink = { padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', color: 'var(--brand)', fontWeight: 600, fontSize: 13, textDecoration: 'none', alignSelf: 'center' };
