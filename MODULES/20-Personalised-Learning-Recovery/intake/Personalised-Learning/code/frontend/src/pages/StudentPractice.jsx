/* ⭐ Student Practice — adaptive spaced-repetition practice (route /student/pl/practice).
   GET /practice/next?student_id= → {question:{id,question_id,wiswits_id,difficulty,bloom,
     est_time_sec,marks,stem,has_solution}, reason, target_wiswits_id, subject_id}
     — NOTE: the question object does NOT expose options or the correct answer (has_solution
     is just a boolean flag), so correctness can't be auto-graded client-side. We ask the
     student to self-report "did you get it right?" as instructed.
   POST /practice/response {student_id, question_id, wiswits_id, is_correct, time_sec,
     est_time_sec} → {quality, card:{...spaced-repetition state}}
   GET /practice/streak?student_id= → {current_streak, longest_streak_seen}
   GET /practice/stats?student_id= → {cards_total, cards_due, cards_mastered, avg_ease_factor}
   GET /practice/due?student_id= → {due:[...]} (not rendered as a queue here — /next already
     prioritises due cards; used only to enrich the sidebar) */

import { useEffect, useRef, useState } from 'react';
import { Panel, StatCard } from '../components/ui.jsx';

const STUDENT_ID = 900001;
const HEADERS = { 'x-role': 'student', 'x-org-id': '9001', 'content-type': 'application/json' };

const REASON_LABEL = {
  spaced_repetition: ['🔁 Review', 'brand'],
  weak_area: ['🎯 Weak area', 'warn'],
  challenge: ['🚀 Challenge', 'good'],
};

export default function StudentPractice() {
  const [question, setQuestion] = useState(null);
  const [reason, setReason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(null);
  const [stats, setStats] = useState(null);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    loadNext();
    loadSidebar();
  }, []);

  function loadSidebar() {
    fetch(`/api/pl/practice/streak?student_id=${STUDENT_ID}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : Promise.reject())).then(setStreak).catch(() => {});
    fetch(`/api/pl/practice/stats?student_id=${STUDENT_ID}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : Promise.reject())).then(setStats).catch(() => {});
  }

  function loadNext() {
    setLoading(true);
    setErr(null);
    setAnswered(false);
    setFeedback(null);
    fetch(`/api/pl/practice/next?student_id=${STUDENT_ID}`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((d) => {
        setQuestion(d?.question ?? null);
        setReason(d?.reason ?? null);
        startedAt.current = Date.now();
      })
      .catch((e) => setErr(e?.detail || e?.error || 'failed to load practice question'))
      .finally(() => setLoading(false));
  }

  async function respond(isCorrect) {
    if (!question) return;
    const timeSec = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    setAnswered(true);
    try {
      const res = await fetch('/api/pl/practice/response', {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          student_id: STUDENT_ID,
          question_id: question.question_id ?? question.id,
          wiswits_id: question.wiswits_id,
          is_correct: isCorrect,
          time_sec: timeSec,
          est_time_sec: question.est_time_sec,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ tone: 'bad', text: `⚠️ ${body?.detail || body?.error || 'could not save response'}` });
      } else {
        setFeedback({
          tone: isCorrect ? 'good' : 'warn',
          text: isCorrect ? "✅ Nice! We'll space this one out further." : "📌 Noted — we'll bring this back sooner.",
        });
        loadSidebar();
      }
    } catch {
      setFeedback({ tone: 'bad', text: '⚠️ Network error — try again.' });
    }
  }

  const reasonMeta = reason ? REASON_LABEL[reason] : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>📝 Practice</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>A little every day beats a lot once in a while.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
        <StatCard value={streak?.current_streak ?? '…'} label="Current streak 🔥" tone="brand" />
        <StatCard value={streak?.longest_streak_seen ?? '…'} label="Best streak" />
        <StatCard value={stats?.cards_due ?? '…'} label="Cards due" tone={stats?.cards_due > 0 ? 'warn' : 'text'} />
        <StatCard value={stats?.cards_mastered ?? '…'} label="Mastered" tone="good" />
      </div>

      <Panel title="Question">
        {loading && <div style={{ color: 'var(--text-faint)' }}>Loading…</div>}
        {err && <div style={{ color: 'var(--bad)' }}>⚠️ {err}</div>}
        {!loading && !err && !question && (
          <div style={{ color: 'var(--good)' }}>✅ No more practice questions right now — check back later!</div>
        )}
        {!loading && !err && question && (
          <div>
            {reasonMeta && (
              <span style={{ display: 'inline-block', marginBottom: 12, fontSize: 12, fontWeight: 600, color: `var(--${reasonMeta[1]})`, background: `var(--${reasonMeta[1]}-soft)`, borderRadius: 999, padding: '4px 10px' }}>
                {reasonMeta[0]}
              </span>
            )}
            <div style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 18 }}>{question.stem}</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 18 }}>
              {question.difficulty} · {question.bloom} · {question.marks} marks · ~{question.est_time_sec}s
            </div>

            {!answered && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => respond(true)} style={selfReportBtn('good')}>✅ Got it right</button>
                <button onClick={() => respond(false)} style={selfReportBtn('bad')}>❌ Got it wrong</button>
              </div>
            )}

            {answered && (
              <div style={{ display: 'grid', gap: 12 }}>
                {feedback && (
                  <div style={{ fontSize: 13, color: `var(--${feedback.tone})`, background: `var(--${feedback.tone}-soft)`, borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                    {feedback.text}
                  </div>
                )}
                <button onClick={loadNext} style={{ minHeight: 44, borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  Next question →
                </button>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

function selfReportBtn(tone) {
  return {
    flex: 1,
    minHeight: 48,
    borderRadius: 'var(--radius-sm)',
    border: `1px solid var(--${tone})`,
    background: `var(--${tone}-soft)`,
    color: `var(--${tone})`,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  };
}
