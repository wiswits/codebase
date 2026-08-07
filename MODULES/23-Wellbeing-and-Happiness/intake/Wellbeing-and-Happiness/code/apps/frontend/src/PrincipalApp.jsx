import React, { useEffect, useMemo, useState } from 'react';
import { makeApi, DEV_IDENTITIES } from './api.js';

// The principal wellness board (PRD Part 8). Numbers, not names. The board
// carries its own limits: an explicit "what you cannot see" section.

export default function PrincipalApp() {
  const api = useMemo(() => makeApi(DEV_IDENTITIES.principal), []);
  const [board, setBoard] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/wb/wellness-board', {
      headers: { 'x-wb-actor-id': '3', 'x-wb-role': 'principal', 'x-wb-org-id': '1' },
    }).then((r) => r.json()).then((j) => { if (j.data) setBoard(j.data); else setErr('load'); })
      .catch(() => setErr('load'));
  }, []);

  const k = board?.kpis;

  return (
    <main className="shell">
      <section className="card" style={{ textAlign: 'left' }}>
        <h2>🌱 School Wellness</h2>

        {err && <p className="muted small">Board abhi load nahi hua (backend + DB chahiye). Neeche layout preview hai.</p>}

        <div className="kpi-row">
          <div className="kpi"><span className="kpi-n">{k?.check_in_rate ?? '84'}%</span><span className="kpi-l">Check-in rate</span></div>
          <div className="kpi"><span className="kpi-n">{k?.open_cases ?? '12'}</span><span className="kpi-l">Open cases</span></div>
          <div className="kpi"><span className="kpi-n">{k?.sla_met_rate ?? '96'}%</span><span className="kpi-l">SLA met</span></div>
        </div>

        <h3>How cases came</h3>
        <div className="source-mix">
          {(board?.flags_by_source?.length ? board.flags_by_source : [
            { source: 'self_raise', n: 12 }, { source: 'teacher_concern', n: 6 }, { source: 'pulse_low_5days', n: 4 },
          ]).map((s) => (
            <div key={s.source} className="mood-bar-row">
              <span className="mood-bar-label">{s.source}</span>
              <span className="mood-bar-track"><span className="mood-bar-fill" style={{ width: `${Math.min(100, s.n * 6)}%` }} /></span>
              <span className="mood-bar-n">{s.n}</span>
            </div>
          ))}
        </div>
        <p className="muted small">💡 Jab bachche khud aayein, wo bharosa ka signal hai.</p>

        <h3>⚠️ What you cannot see</h3>
        <ul className="cannot-see">
          {(board?.what_you_cannot_see || [
            "Any student's name", "Any student's mood", "Any case detail",
            "Any journal content", "Any session note",
          ]).map((w) => <li key={w}>{w}</li>)}
        </ul>
        <p className="muted small">Ye jaanbujh ke hai. Aapka kaam system banana hai. Bachchon ka ilaaj counsellor ka kaam hai.</p>
      </section>
    </main>
  );
}
