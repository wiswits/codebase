/* ⭐⭐ Student Attempt UI — mobile-first, offline-capable (spec 8.5).
   One question per screen · silent time tracking · changed-answer tracking ·
   offline queue with localStorage + sync on reconnect · auto-submit on timeout. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { enqueueResponse, enqueueEvent, flushQueue, queueSize, clearQueue } from '../lib/offlineQueue.js';
import ResultView from './ResultView.jsx';

const STUDENT_ID = 900001; // demo student
const H = { 'content-type': 'application/json', 'x-role': 'student', 'x-org-id': '9001' };

export default function StudentAttempt() {
  const [phase, setPhase] = useState('loading'); // loading | attempt | result
  const [attemptId, setAttemptId] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // qid -> {selected, marked_review, visits}
  const [navOpen, setNavOpen] = useState(false);
  const [roughOpen, setRoughOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [result, setResult] = useState(null);
  const visibleSinceRef = useRef(Date.now());

  // ─── boot: create demo test + start/resume attempt ──────────
  useEffect(() => {
    (async () => {
      let testId = Number(sessionStorage.getItem('pl_demo_test_id'));
      if (!testId) {
        const t = await fetch('/api/pl/tests/demo-online', { method: 'POST', headers: H, body: JSON.stringify({}) }).then((r) => r.json());
        testId = t.id;
        sessionStorage.setItem('pl_demo_test_id', String(testId));
      }
      const start = await fetch('/api/pl/attempts/start', { method: 'POST', headers: H, body: JSON.stringify({ test_id: testId, student_id: STUDENT_ID }) }).then((r) => r.json());
      setAttemptId(start.attempt_id);
      setTest(start.test);
      setQuestions(start.questions);
      setSecondsLeft(start.test.duration_min * 60);
      setPhase('attempt');
      visibleSinceRef.current = Date.now();
    })();
  }, []);

  // ─── connectivity + periodic flush ───────────────────────────
  useEffect(() => {
    if (!attemptId) return;
    const onOnline = () => { setOnline(true); tryFlush(); };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const iv = setInterval(tryFlush, 5000);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  async function tryFlush() {
    if (!attemptId || !navigator.onLine) { setPending(queueSize(attemptId)); return; }
    try {
      await flushQueue(attemptId, H);
      setPending(0);
    } catch {
      setPending(queueSize(attemptId));
    }
  }

  // ─── countdown + auto-submit ──────────────────────────────────
  useEffect(() => {
    if (phase !== 'attempt' || secondsLeft == null) return;
    if (secondsLeft <= 0) { submit('timeout'); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase]);

  const q = questions[idx];

  function saveResponse(qid, payload) {
    const body = { test_question_id: qid, ...payload };
    if (navigator.onLine) {
      fetch(`/api/pl/attempts/${attemptId}/response`, { method: 'POST', headers: H, body: JSON.stringify(body) })
        .catch(() => { enqueueResponse(attemptId, body); setPending(queueSize(attemptId)); });
    } else {
      enqueueResponse(attemptId, body);
      setPending(queueSize(attemptId));
    }
  }

  function elapsedAndReset() {
    const now = Date.now();
    const delta = Math.round((now - visibleSinceRef.current) / 1000);
    visibleSinceRef.current = now;
    return Math.max(0, delta);
  }

  function selectOption(key) {
    const timeSec = elapsedAndReset();
    setAnswers((a) => ({ ...a, [q.test_question_id]: { ...(a[q.test_question_id] || {}), selected: key } }));
    saveResponse(q.test_question_id, { selected: key, time_sec: timeSec });
    logEvent('answer', q.test_question_id, { key });
  }

  function toggleReview() {
    const cur = answers[q.test_question_id] || {};
    const marked = !cur.marked_review;
    setAnswers((a) => ({ ...a, [q.test_question_id]: { ...cur, marked_review: marked } }));
    saveResponse(q.test_question_id, { marked_review: marked, time_sec: 0 });
    logEvent('review', q.test_question_id, { marked });
  }

  function logEvent(event, question_id, meta) {
    const body = { question_id, event, meta };
    if (navigator.onLine) fetch(`/api/pl/attempts/${attemptId}/event`, { method: 'POST', headers: H, body: JSON.stringify(body) }).catch(() => enqueueEvent(attemptId, body));
    else enqueueEvent(attemptId, body);
  }

  function leaveCurrentQuestion() {
    if (!q) return;
    const timeSec = elapsedAndReset();
    if (timeSec > 0) saveResponse(q.test_question_id, { time_sec: timeSec });
  }

  function goTo(newIdx) {
    leaveCurrentQuestion();
    setIdx(Math.max(0, Math.min(questions.length - 1, newIdx)));
    setNavOpen(false);
    setRoughOpen(false);
    logEvent('view', questions[newIdx]?.test_question_id, {});
  }

  async function submit(reason = 'manual') {
    leaveCurrentQuestion();
    await tryFlush();
    const res = await fetch(`/api/pl/attempts/${attemptId}/submit`, { method: 'POST', headers: H, body: JSON.stringify({ reason }) }).then((r) => r.json());
    clearQueue(attemptId);
    setResult(res);
    setPhase('result');
  }

  const status = useMemo(() => {
    return questions.map((qq, i) => {
      const a = answers[qq.test_question_id];
      if (a?.selected) return 'answered';
      if (a?.marked_review) return 'review';
      if (i < idx) return 'skipped';
      return 'unvisited';
    });
  }, [questions, answers, idx]);

  if (phase === 'loading') return <Center>Loading test…</Center>;
  if (phase === 'result') return <ResultView result={result} onRestart={() => { sessionStorage.removeItem('pl_demo_test_id'); window.location.reload(); }} />;
  if (!q) return <Center>No questions.</Center>;

  const mm = String(Math.floor((secondsLeft || 0) / 60)).padStart(2, '0');
  const ss = String((secondsLeft || 0) % 60).padStart(2, '0');
  const answeredCount = status.filter((s) => s === 'answered').length;
  const reviewCount = status.filter((s) => s === 'review').length;

  return (
    <div style={phoneWrap}>
      <div style={phoneScreen}>
        {/* header */}
        <div style={header}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{test.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span>⏱ {mm}:{ss}</span>
            <span style={{ color: online ? 'var(--good)' : 'var(--warn)' }}>
              {online ? '🔋 Online' : `📴 Offline${pending ? ` (${pending})` : ''}`}
            </span>
          </div>
        </div>

        <div style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-faint)' }}>
          Q {idx + 1} of {questions.length} · {q.marks} marks
          <div style={dotsRow}>
            {questions.map((_, i) => (
              <span key={i} style={{ ...dot, background: i === idx ? 'var(--brand)' : status[i] === 'answered' ? 'var(--good)' : 'var(--border)' }} />
            ))}
          </div>
        </div>

        <div style={{ padding: '4px 16px 16px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 18 }}>{q.stem}</div>

          {q.options.map((o) => {
            const selected = answers[q.test_question_id]?.selected === o.key;
            return (
              <button key={o.key} onClick={() => selectOption(o.key)} style={{ ...optBtn, ...(selected ? optBtnSelected : {}) }}>
                <span style={optKey}>{o.key}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{o.text}</span>
                {selected && <span>✓</span>}
              </button>
            );
          })}

          <button onClick={toggleReview} style={{ ...secondaryBtn, marginTop: 4, color: answers[q.test_question_id]?.marked_review ? 'var(--warn)' : 'var(--text-dim)' }}>
            🔖 {answers[q.test_question_id]?.marked_review ? 'Marked for review' : 'Mark for review'}
          </button>
          <button onClick={() => setRoughOpen((v) => !v)} style={secondaryBtn}>✏️ Rough work</button>
          {roughOpen && <textarea placeholder="Scratch pad — not graded" style={roughPad} />}
        </div>

        <div style={navRow}>
          <button onClick={() => goTo(idx - 1)} disabled={idx === 0} style={navBtn}>← Prev</button>
          {idx < questions.length - 1
            ? <button onClick={() => goTo(idx + 1)} style={{ ...navBtn, background: 'var(--brand)', color: '#fff' }}>Next →</button>
            : <button onClick={() => submit('manual')} style={{ ...navBtn, background: 'var(--good)', color: '#04140a' }}>Submit ✓</button>}
        </div>

        <div style={footer}>
          <button onClick={() => setNavOpen(true)} style={footerBtn}>☰ Navigator</button>
          <button onClick={() => submit('manual')} style={{ ...footerBtn, color: 'var(--bad)' }}>Submit</button>
        </div>

        {navOpen && (
          <div style={overlay} onClick={() => setNavOpen(false)}>
            <div style={navSheet} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10 }}>
                ✅ Answered {answeredCount} · 🔖 Review {reviewCount} · Remaining {questions.length - answeredCount}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {questions.map((qq, i) => (
                  <button key={i} onClick={() => goTo(i)} style={{ ...navCell, ...navCellTone(status[i]) }}>{i + 1}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function navCellTone(s) {
  if (s === 'answered') return { background: 'var(--good-soft)', color: 'var(--good)', borderColor: 'var(--good)' };
  if (s === 'review') return { background: 'var(--warn-soft)', color: 'var(--warn)', borderColor: 'var(--warn)' };
  if (s === 'skipped') return { background: 'var(--bad-soft)', color: 'var(--bad)', borderColor: 'var(--bad)' };
  return { background: 'var(--panel-2)', color: 'var(--text-faint)' };
}

function Center({ children }) {
  return <div style={{ ...phoneWrap }}><div style={{ ...phoneScreen, alignItems: 'center', justifyContent: 'center', display: 'flex' }}>{children}</div></div>;
}

const phoneWrap = { display: 'flex', justifyContent: 'center', padding: '20px 0' };
const phoneScreen = { width: 390, maxWidth: '100%', minHeight: 640, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' };
const dotsRow = { display: 'flex', gap: 3, marginTop: 6, flexWrap: 'wrap' };
const dot = { width: 6, height: 6, borderRadius: 3 };
const optBtn = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 44, padding: '12px 14px', marginBottom: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--panel-2)', color: 'var(--text)', fontSize: 14, cursor: 'pointer', textAlign: 'left' };
const optBtnSelected = { border: '2px solid var(--brand)', background: 'var(--brand-soft)' };
const optKey = { width: 26, height: 26, borderRadius: '50%', background: 'var(--panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 };
const secondaryBtn = { display: 'block', width: '100%', minHeight: 44, background: 'transparent', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-dim)', fontSize: 13, marginTop: 8, cursor: 'pointer' };
const roughPad = { width: '100%', minHeight: 100, marginTop: 8, background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: 10, fontFamily: 'var(--mono)', fontSize: 12 };
const navRow = { display: 'flex', gap: 10, padding: '10px 16px' };
const navBtn = { flex: 1, minHeight: 44, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--panel-2)', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' };
const footer = { display: 'flex', borderTop: '1px solid var(--border)' };
const footerBtn = { flex: 1, minHeight: 48, background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: 13, cursor: 'pointer' };
const overlay = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' };
const navSheet = { width: '100%', background: 'var(--panel)', borderTop: '1px solid var(--border)', borderRadius: '16px 16px 0 0', padding: 16, maxHeight: '70%', overflowY: 'auto' };
const navCell = { minHeight: 44, borderRadius: 8, border: '1px solid var(--border)', fontWeight: 600, cursor: 'pointer' };
