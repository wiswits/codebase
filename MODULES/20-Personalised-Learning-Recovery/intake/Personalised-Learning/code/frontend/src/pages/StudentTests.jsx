/* Student Tests — route /student/pl/tests.
   GET /my/tests?student_id= → {pending:[{assignment_id,test_id,title,type,mode,total_questions,
     total_marks,duration_min,opens_at,closes_at,attempts_allowed,status}],
     done:[{attempt_id,test_id,title,type,mode,score,max_score,percentage,correct_count,
     wrong_count,skipped_count,submitted_at,evaluated_at}]}
   NOTE: the existing /student/pl/attempt page always starts/resumes the same demo-online
   test regardless of which pending test is clicked (pre-existing limitation) — we link there
   honestly rather than pretending otherwise. */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel, toneForAccuracy } from '../components/ui.jsx';

const STUDENT_ID = 900001;
const HEADERS = { 'x-role': 'student', 'x-org-id': '9001' };

export default function StudentTests() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch(`/api/pl/my/tests?student_id=${STUDENT_ID}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then(setData)
      .catch((e) => setErr(e?.detail || e?.error || 'failed to load tests'));
  }, []);

  if (err) return <Panel><span style={{ color: 'var(--bad)' }}>⚠️ {err}</span></Panel>;
  if (!data) return <Panel>Loading tests…</Panel>;

  const pending = data.pending ?? [];
  const done = data.done ?? [];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>🗒️ My Tests</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>{pending.length} pending · {done.length} completed</p>
      </div>

      <Panel title="Pending">
        {pending.length === 0 && <div style={{ color: 'var(--good)' }}>Nothing pending — you're all caught up! 🎉</div>}
        <div style={{ display: 'grid', gap: 10 }}>
          {pending.map((t) => (
            <Link
              key={t.assignment_id}
              to="/student/pl/attempt"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)' }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                  {t.type} · {t.total_questions} q · {t.total_marks} marks · {t.duration_min} min
                </div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--brand)' }}>Start →</span>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel title="Done">
        {done.length === 0 && <div style={{ color: 'var(--text-faint)' }}>No completed tests yet.</div>}
        <div style={{ display: 'grid', gap: 10 }}>
          {done.map((t) => (
            <Link
              key={t.attempt_id}
              to={`/student/pl/result/${t.attempt_id}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)' }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                  {t.correct_count} correct · {t.wrong_count} wrong · {t.skipped_count} skipped
                </div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: `var(--${toneForAccuracy(t.percentage ?? 0)})` }}>{t.percentage}%</span>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
