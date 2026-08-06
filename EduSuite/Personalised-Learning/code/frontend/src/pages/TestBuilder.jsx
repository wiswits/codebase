/* ⭐ Test Builder — create a test via 3 modes (spec: /teacher/pl/tests/create).
   1) From QBank  2) Manual (type questions in)  3) Blank draft. */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel } from '../components/ui.jsx';

const H = { 'content-type': 'application/json', 'x-role': 'teacher', 'x-org-id': '9001' };

const MODES = [
  { key: 'qbank', label: 'From QBank' },
  { key: 'manual', label: 'Manual' },
  { key: 'blank', label: 'Blank Draft' },
];

export default function TestBuilder() {
  const [mode, setMode] = useState('qbank');
  const navigate = useNavigate();

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>Create Test</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Pick a mode to build a new test.</p>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${mode === m.key ? 'var(--brand)' : 'var(--border)'}`,
              background: mode === m.key ? 'var(--brand-soft)' : 'var(--panel-2)',
              color: mode === m.key ? 'var(--text)' : 'var(--text-dim)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'qbank' && <QBankForm navigate={navigate} />}
      {mode === 'manual' && <ManualForm navigate={navigate} />}
      {mode === 'blank' && <BlankForm navigate={navigate} />}
    </div>
  );
}

/* ---------- shared bits ---------- */

function ErrorBox({ msg }) {
  if (!msg) return null;
  return <p style={{ color: 'var(--bad)', fontSize: 13, margin: '8px 0 0' }}>⚠️ {msg}</p>;
}

const label = { display: 'block', fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 };
const input = { width: '100%', padding: '9px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--panel-2)', color: 'var(--text)', fontSize: 14 };
const field = { display: 'grid', gap: 4 };
const btnPrimary = { padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' };
const btnSecondary = { padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--panel-2)', color: 'var(--text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' };

/* ---------- 1) From QBank ---------- */

function QBankForm({ navigate }) {
  const [title, setTitle] = useState('');
  const [classNo, setClassNo] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [wiswitsIds, setWiswitsIds] = useState('');
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const ids = wiswitsIds.split(',').map((s) => s.trim()).filter(Boolean);
      const body = {
        title: title || `QBank Test · ${new Date().toLocaleDateString()}`,
        subject_id: 9001,
        class_no: Number(classNo),
        filters: { difficulty, ...(ids.length ? { wiswits_ids: ids } : {}) },
        count: Number(count),
      };
      const res = await fetch('/api/pl/tests/from-qbank', { method: 'POST', headers: H, body: JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'failed to create test');
      navigate(`/teacher/pl/tests/${j.id}`);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="From QBank">
      <form onSubmit={submit} style={{ display: 'grid', gap: 14, maxWidth: 480 }}>
        <div style={field}>
          <label style={label}>Title</label>
          <input style={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unit 3 Practice" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={field}>
            <label style={label}>Class</label>
            <input style={input} type="number" value={classNo} onChange={(e) => setClassNo(e.target.value)} />
          </div>
          <div style={field}>
            <label style={label}>Difficulty</label>
            <select style={input} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
        <div style={field}>
          <label style={label}>WISWITS IDs (comma-separated, optional — required by backend if no other filter matches)</label>
          <input style={input} value={wiswitsIds} onChange={(e) => setWiswitsIds(e.target.value)} placeholder="MATH10C01T01, MATH10C01T02" />
        </div>
        <div style={field}>
          <label style={label}>Question count</label>
          <input style={input} type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} />
        </div>
        <button type="submit" disabled={busy} style={btnPrimary}>{busy ? 'Creating…' : 'Create Test'}</button>
        <ErrorBox msg={err} />
      </form>
    </Panel>
  );
}

/* ---------- 2) Manual ---------- */

const BLANK_Q = { stem: '', difficulty: 'easy', bloom: 'remember', options: ['', '', '', ''], correct: 0, marks: 2 };

function ManualForm({ navigate }) {
  const [title, setTitle] = useState('');
  const [classNo, setClassNo] = useState(10);
  const [mode, setMode] = useState('online');
  const [questions, setQuestions] = useState([{ ...BLANK_Q, options: [...BLANK_Q.options] }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  function updateQ(i, patch) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function updateOption(i, oi, val) {
    setQuestions((qs) => qs.map((q, idx) => {
      if (idx !== i) return q;
      const options = q.options.slice();
      options[oi] = val;
      return { ...q, options };
    }));
  }
  function addQuestion() {
    setQuestions((qs) => [...qs, { ...BLANK_Q, options: [...BLANK_Q.options] }]);
  }
  function removeQuestion(i) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const payload = {
        title: title || `Manual Test · ${new Date().toLocaleDateString()}`,
        subject_id: 9001,
        class_no: Number(classNo),
        mode,
        questions: questions.map((q) => ({
          wiswits_id: 'MATH10C01T02',
          bloom: q.bloom,
          difficulty: q.difficulty,
          stem: q.stem,
          options: q.options.map((text, oi) => ({ key: String.fromCharCode(65 + oi), text, is_correct: oi === Number(q.correct) })),
          correct: String.fromCharCode(65 + Number(q.correct)),
          marks: Number(q.marks) || 1,
        })),
      };
      const res = await fetch('/api/pl/tests/manual', { method: 'POST', headers: H, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'failed to create test');
      navigate(`/teacher/pl/tests/${j.id}`);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Manual">
      <form onSubmit={submit} style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, maxWidth: 620 }}>
          <div style={field}>
            <label style={label}>Title</label>
            <input style={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly Quiz" />
          </div>
          <div style={field}>
            <label style={label}>Class</label>
            <input style={input} type="number" value={classNo} onChange={(e) => setClassNo(e.target.value)} />
          </div>
          <div style={field}>
            <label style={label}>Mode</label>
            <select style={input} value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          {questions.map((q, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14, background: 'var(--panel-2)', display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Question {i + 1}</span>
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(i)} style={{ ...btnSecondary, padding: '4px 10px', fontSize: 12 }}>Remove</button>
                )}
              </div>
              <div style={field}>
                <label style={label}>Stem</label>
                <input style={input} value={q.stem} onChange={(e) => updateQ(i, { stem: e.target.value })} placeholder="Question text" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {q.options.map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="radio"
                      name={`correct-${i}`}
                      checked={Number(q.correct) === oi}
                      onChange={() => updateQ(i, { correct: oi })}
                    />
                    <input
                      style={{ ...input, flex: 1 }}
                      value={opt}
                      onChange={(e) => updateOption(i, oi, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div style={field}>
                  <label style={label}>Difficulty</label>
                  <select style={input} value={q.difficulty} onChange={(e) => updateQ(i, { difficulty: e.target.value })}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div style={field}>
                  <label style={label}>Bloom</label>
                  <select style={input} value={q.bloom} onChange={(e) => updateQ(i, { bloom: e.target.value })}>
                    {['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div style={field}>
                  <label style={label}>Marks</label>
                  <input style={input} type="number" min={1} value={q.marks} onChange={(e) => updateQ(i, { marks: e.target.value })} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={addQuestion} style={btnSecondary}>+ Add Question</button>
          <button type="submit" disabled={busy} style={btnPrimary}>{busy ? 'Creating…' : 'Create Test'}</button>
        </div>
        <ErrorBox msg={err} />
      </form>
    </Panel>
  );
}

/* ---------- 3) Blank draft ---------- */

function BlankForm({ navigate }) {
  const [title, setTitle] = useState('');
  const [classNo, setClassNo] = useState(10);
  const [type, setType] = useState('unit');
  const [mode, setMode] = useState('online');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const body = { title: title || `Draft Test · ${new Date().toLocaleDateString()}`, subject_id: 9001, class_no: Number(classNo), type, mode };
      const res = await fetch('/api/pl/tests', { method: 'POST', headers: H, body: JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'failed to create test');
      navigate(`/teacher/pl/tests/${j.id}`);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Blank Draft">
      <form onSubmit={submit} style={{ display: 'grid', gap: 14, maxWidth: 480 }}>
        <div style={field}>
          <label style={label}>Title</label>
          <input style={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Untitled Draft" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div style={field}>
            <label style={label}>Class</label>
            <input style={input} type="number" value={classNo} onChange={(e) => setClassNo(e.target.value)} />
          </div>
          <div style={field}>
            <label style={label}>Type</label>
            <select style={input} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="unit">Unit</option>
              <option value="practice">Practice</option>
              <option value="term">Term</option>
            </select>
          </div>
          <div style={field}>
            <label style={label}>Mode</label>
            <select style={input} value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={busy} style={btnPrimary}>{busy ? 'Creating…' : 'Create Draft'}</button>
        <ErrorBox msg={err} />
      </form>
    </Panel>
  );
}
