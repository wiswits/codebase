/* ⭐⭐⭐ Offline Marks Entry — THE adoption screen (spec 8.1).
   Keyboard-only, auto-advance, absent marking, submit → instant analysis.
   Target: 32 students × N questions in < 5 min, mouse never touched. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Panel, Bar, toneForAccuracy } from '../components/ui.jsx';
import { roster, SAMPLE_MAP } from '../data/roster.js';

const H = { 'content-type': 'application/json', 'x-role': 'teacher', 'x-org-id': '9001' };
const ABSENT = 'A';

export default function OfflineMarksEntry() {
  const students = useMemo(() => roster(32), []);
  const map = SAMPLE_MAP;
  const nQ = map.length;

  // grid[studentIdx][qIdx] = number | 'A' | ''
  const [grid, setGrid] = useState(() => students.map(() => Array(nQ).fill('')));
  const [cursor, setCursor] = useState({ s: 0, q: 0 });
  const [testId, setTestId] = useState(null);
  const [result, setResult] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [saved, setSaved] = useState('—');
  const startedRef = useRef(Date.now());
  const gridRef = useRef(grid);
  gridRef.current = grid;

  // prepare the offline test + map on mount
  useEffect(() => {
    (async () => {
      try {
        const t = await fetch('/api/pl/tests/offline', { method: 'POST', headers: H,
          body: JSON.stringify({ title: `Unit Test · ${new Date().toLocaleDateString()}`, subject_id: 9001, total_questions: nQ, marks_per_q: 2 }) }).then((r) => r.json());
        await fetch(`/api/pl/tests/${t.id}/question-map`, { method: 'POST', headers: H, body: JSON.stringify({ map }) });
        setTestId(t.id);
      } catch { /* offline: still usable, submit will warn */ }
    })();
  }, []);

  // elapsed timer + autosave heartbeat
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startedRef.current) / 1000)), 1000);
    const save = setInterval(() => {
      localStorage.setItem('pl_marks_draft', JSON.stringify(gridRef.current));
      setSaved(new Date().toLocaleTimeString());
    }, 10000);
    return () => { clearInterval(iv); clearInterval(save); };
  }, []);

  function setCell(s, q, val) {
    setGrid((g) => {
      const next = g.map((row) => row.slice());
      next[s][q] = val;
      return next;
    });
  }

  function move(ds, dq) {
    setCursor((c) => {
      let s = c.s + ds;
      let q = c.q + dq;
      if (q >= nQ) { q = 0; s += 1; }
      if (q < 0) { q = nQ - 1; s -= 1; }
      s = Math.max(0, Math.min(students.length - 1, s));
      q = Math.max(0, Math.min(nQ - 1, q));
      return { s, q };
    });
  }

  function onKeyDown(e) {
    const { s, q } = cursor;
    const k = e.key;
    if (['0', '1', '2'].includes(k)) {
      setCell(s, q, Number(k));
      e.preventDefault();
      move(0, 1); // auto-advance to next question
    } else if (k.toLowerCase() === 'a') {
      // mark whole student absent, jump to next student
      setGrid((g) => { const n = g.map((r) => r.slice()); for (let i = 0; i < nQ; i++) n[s][i] = ABSENT; return n; });
      setCursor({ s: Math.min(students.length - 1, s + 1), q: 0 });
      e.preventDefault();
    } else if (k === 'Enter') { setCursor({ s: Math.min(students.length - 1, s + 1), q: 0 }); e.preventDefault(); }
    else if (k === 'Tab') { move(0, e.shiftKey ? -1 : 1); e.preventDefault(); }
    else if (k === 'ArrowRight') { move(0, 1); e.preventDefault(); }
    else if (k === 'ArrowLeft') { move(0, -1); e.preventDefault(); }
    else if (k === 'ArrowDown') { move(1, 0); e.preventDefault(); }
    else if (k === 'ArrowUp') { move(-1, 0); e.preventDefault(); }
    else if (k === 'Backspace') { setCell(s, q, ''); e.preventDefault(); }
  }

  const filled = grid.filter((row) => row.some((c) => c !== '')).length;
  const total = (row) => row.some((c) => c === ABSENT) ? 'AB' : row.reduce((a, c) => a + (typeof c === 'number' ? c : 0), 0);

  async function submit() {
    const payload = {
      students: students.map((stu, i) => {
        const row = grid[i];
        if (row.some((c) => c === ABSENT)) return { student_id: stu.student_id, absent: true };
        return { student_id: stu.student_id, marks: row.map((c) => (typeof c === 'number' ? c : 0)) };
      }),
    };
    const res = await fetch(`/api/pl/tests/${testId}/marks-entry`, { method: 'POST', headers: H, body: JSON.stringify(payload) }).then((r) => r.json());
    setResult(res);
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div style={{ display: 'grid', gap: 16 }} tabIndex={0} onKeyDown={onKeyDown}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>Offline Marks Entry · Class 10-A · Mathematics</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: 14 }}>
          {nQ} questions · keyboard only. <kbd style={kbd}>0/1/2</kbd> marks · <kbd style={kbd}>A</kbd> absent · <kbd style={kbd}>Tab</kbd> next Q · <kbd style={kbd}>Enter</kbd> next student · <kbd style={kbd}>↑↓</kbd> move
        </p>
      </div>

      <Panel style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: 'var(--mono)', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...hcell, textAlign: 'left', position: 'sticky', left: 0, background: 'var(--panel-2)' }}>Roll · Name</th>
              {map.map((m, i) => <th key={i} style={hcell} title={m.wiswits_id}>Q{i + 1}</th>)}
              <th style={hcell}>Total</th>
            </tr>
          </thead>
          <tbody>
            {students.map((stu, si) => {
              const isAbsent = grid[si].some((c) => c === ABSENT);
              return (
                <tr key={stu.student_id}>
                  <td style={{ ...cell, textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: cursor.s === si ? 'var(--brand-soft)' : 'var(--panel)' }}>
                    {stu.roll} · {stu.name}
                  </td>
                  {grid[si].map((val, qi) => {
                    const active = cursor.s === si && cursor.q === qi;
                    return (
                      <td key={qi}
                        onClick={() => setCursor({ s: si, q: qi })}
                        style={{ ...cell, cursor: 'pointer',
                          outline: active ? '2px solid var(--brand)' : 'none',
                          background: active ? 'var(--brand-soft)' : val === ABSENT ? 'var(--warn-soft)' : 'transparent',
                          color: val === ABSENT ? 'var(--warn)' : val === 0 ? 'var(--bad)' : 'var(--text)' }}>
                        {val === '' ? '·' : val}
                      </td>
                    );
                  })}
                  <td style={{ ...cell, fontWeight: 700, color: isAbsent ? 'var(--warn)' : 'var(--text)' }}>{total(grid[si])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 240 }}>
          <Bar pct={(filled / students.length) * 100} />
          <span style={{ fontSize: 13, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{filled} / {students.length}</span>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>⏱ {mm}:{ss} · saved {saved}</span>
        <button onClick={submit} disabled={!testId} style={btn}>Submit → Analyze ⚡</button>
      </div>

      {result?.summary && (
        <Panel title={`Analysis ready in ${result.took_ms} ms ⚡`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(90px,1fr))', gap: 12, marginBottom: 16 }}>
            {[['avg', `${result.summary.avg}%`], ['median', `${result.summary.median}%`], ['topper', `${result.summary.topper}%`], ['lowest', `${result.summary.lowest}%`], ['attempted', result.summary.attempted], ['absent', result.summary.absent]].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center', background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
          <h3 style={{ fontSize: 13, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Topic health</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {result.topic_health.map((t) => (
              <div key={t.wiswits_id} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 48px', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontFamily: 'var(--mono)' }}>{t.wiswits_id}</span>
                <Bar pct={t.accuracy} tone={toneForAccuracy(t.accuracy)} />
                <span style={{ fontSize: 12, textAlign: 'right', color: 'var(--text-dim)' }}>{t.accuracy}%</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

const kbd = { background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontFamily: 'var(--mono)', fontSize: 12 };
const hcell = { padding: '8px 10px', fontSize: 12, color: 'var(--text-faint)', borderBottom: '1px solid var(--border)', textAlign: 'center' };
const cell = { padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid var(--border)', minWidth: 34 };
const btn = { padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--good)', color: '#04140a', fontWeight: 700, cursor: 'pointer', fontSize: 14 };
