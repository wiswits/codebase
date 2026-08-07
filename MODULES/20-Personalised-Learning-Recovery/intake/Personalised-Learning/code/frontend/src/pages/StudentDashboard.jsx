/* ⭐ Student Dashboard — home screen (route /student/pl).
   GET /widgets/my-progress?student_id=       → {current_avg, delta_since_first, trend}
   GET /widgets/my-weak-areas?student_id=     → {weak_areas:[{wiswits_id,label,severity,accuracy,is_root_cause}]}
   GET /widgets/practice-streak?student_id=   → {current_streak, cards_due}
   GET /widgets/next-worksheet?student_id=    → {worksheet, message} (worksheet may be null)
   GET /my/tests?student_id=                  → {pending:[...], done:[...]}
   All widgets keyed by student_id= (not student=). Verified live against a running backend. */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel, StatCard, toneForAccuracy } from '../components/ui.jsx';

const STUDENT_ID = 900001;
const HEADERS = { 'x-role': 'student', 'x-org-id': '9001' };

export default function StudentDashboard() {
  const [progress, setProgress] = useState(null);
  const [weak, setWeak] = useState(null);
  const [streak, setStreak] = useState(null);
  const [worksheet, setWorksheet] = useState(null);
  const [tests, setTests] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const qs = `student_id=${STUDENT_ID}`;

    fetch(`/api/pl/widgets/my-progress?${qs}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setProgress)
      .catch(() => {});

    fetch(`/api/pl/widgets/my-weak-areas?${qs}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setWeak(d?.weak_areas ?? []))
      .catch(() => setWeak([]));

    fetch(`/api/pl/widgets/practice-streak?${qs}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setStreak)
      .catch(() => {});

    fetch(`/api/pl/widgets/next-worksheet?${qs}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setWorksheet)
      .catch(() => {});

    fetch(`/api/pl/my/tests?${qs}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then(setTests)
      .catch((e) => setErr(e?.detail || e?.error || 'failed to load tests'));
  }, []);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>👋 Welcome back</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Your personalized learning home.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
        <StatCard value={progress ? `${progress.current_avg ?? '—'}%` : '…'} label="Current avg" tone={progress?.current_avg != null ? toneForAccuracy(progress.current_avg) : 'text'} />
        <StatCard
          value={progress?.delta_since_first != null ? `${progress.delta_since_first >= 0 ? '+' : ''}${progress.delta_since_first}%` : '—'}
          label="Since first test"
          tone={progress?.delta_since_first >= 0 ? 'good' : 'bad'}
        />
        <StatCard value={streak?.current_streak ?? '…'} label="Practice streak 🔥" tone="brand" />
        <StatCard value={streak?.cards_due ?? '…'} label="Cards due" tone={streak?.cards_due > 0 ? 'warn' : 'text'} />
      </div>

      <Panel
        title="🎯 Your weak areas"
        action={<Link to="/student/pl/weak-areas" style={{ fontSize: 13 }}>View all →</Link>}
      >
        {weak == null && <div style={{ color: 'var(--text-faint)' }}>Loading…</div>}
        {weak && weak.length === 0 && <div style={{ color: 'var(--good)' }}>✅ No open gaps right now — nice work!</div>}
        {weak && weak.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            {weak.slice(0, 4).map((w) => (
              <div key={w.wiswits_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                <span>{w.is_root_cause ? '🚨 ' : ''}{w.label ?? w.wiswits_id}</span>
                <span style={{ color: `var(--${toneForAccuracy(w.accuracy ?? 0)})` }}>{w.accuracy != null ? `${w.accuracy}%` : w.severity}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="📝 Practice"
        action={<Link to="/student/pl/practice" style={{ fontSize: 13 }}>Practice now →</Link>}
      >
        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          {streak?.current_streak ? `🔥 ${streak.current_streak}-day streak — keep it going!` : 'Start your first practice session today.'}
        </div>
      </Panel>

      <Panel
        title="📄 Next worksheet"
        action={<Link to="/student/pl/worksheets" style={{ fontSize: 13 }}>All worksheets →</Link>}
      >
        {!worksheet && <div style={{ color: 'var(--text-faint)' }}>Loading…</div>}
        {worksheet && !worksheet.worksheet && (
          <div style={{ color: 'var(--good)' }}>{worksheet.message ?? 'No worksheet pending.'}</div>
        )}
        {worksheet?.worksheet && (
          <div style={{ fontSize: 13 }}>
            {worksheet.worksheet.total_questions} questions · ~{worksheet.worksheet.est_time_min} min
          </div>
        )}
      </Panel>

      <Panel title="🗒️ Pending tests" action={<Link to="/student/pl/tests" style={{ fontSize: 13 }}>All tests →</Link>}>
        {err && <div style={{ color: 'var(--bad)' }}>⚠️ {err}</div>}
        {!err && !tests && <div style={{ color: 'var(--text-faint)' }}>Loading…</div>}
        {tests && tests.pending?.length === 0 && <div style={{ color: 'var(--text-dim)' }}>No pending tests. 🎉</div>}
        {tests && tests.pending?.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            {tests.pending.slice(0, 5).map((t) => (
              <div key={t.assignment_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                <span>{t.title}</span>
                <span style={{ color: 'var(--text-faint)' }}>{t.total_questions} q · {t.duration_min} min</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
