import React, { useEffect, useMemo, useState } from 'react';
import { makeApi, DEV_IDENTITIES } from './api.js';
import ReasonModal from './screens/counsellor/ReasonModal.jsx';
import ContextView from './screens/counsellor/ContextView.jsx';
import ParentLoopIn from './screens/counsellor/ParentLoopIn.jsx';

// The counsellor desk (PRD Part 7). Queue → (reason modal) → context view →
// parent loop-in. The reason modal cannot be skipped; the context view is only
// reachable through it.

const SEV_META = { red: { icon: '🔴', label: 'RED · 24h SLA' }, amber: { icon: '🟡', label: 'AMBER · Monitor' } };

export default function CounsellorApp() {
  const api = useMemo(() => makeApi(DEV_IDENTITIES.counsellor), []);
  const [flags, setFlags] = useState([]);
  const [loadErr, setLoadErr] = useState('');
  const [pending, setPending] = useState(null);   // studentId awaiting a reason
  const [view, setView] = useState(null);          // { data, reason }
  const [loopIn, setLoopIn] = useState(null);      // caseId

  async function load() {
    try { setFlags((await api.flags()).data || []); setLoadErr(''); }
    catch (e) { setLoadErr(e.message); }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function openContext(studentId, reason) {
    setPending(null);
    try {
      const res = await api.context(studentId, reason);
      setView({ data: res.data, reason });
    } catch (e) { setLoadErr(e.message); }
  }

  if (loopIn != null) {
    return <main className="shell"><ParentLoopIn api={api} caseId={loopIn}
      onCancel={() => setLoopIn(null)} onDone={() => setLoopIn(null)} /></main>;
  }

  if (view) {
    return <main className="shell"><ContextView data={view.data} reason={view.reason}
      onBack={() => setView(null)}
      onLoopInParent={() => setLoopIn(view.data.flag?.id || 1)} /></main>;
  }

  return (
    <main className="shell">
      {pending != null && (
        <ReasonModal onCancel={() => setPending(null)} onContinue={(reason) => openContext(pending, reason)} />
      )}

      <section className="card" style={{ textAlign: 'left' }}>
        <h2>👩‍⚕️ Counsellor Desk</h2>
        <p className="muted small">Open flags: {flags.length}</p>
        {loadErr && <p className="muted small">Queue abhi load nahi hua (backend + DB chahiye).</p>}

        {flags.length === 0 && !loadErr && <p className="muted">Koi open flag nahi. 🌱</p>}

        {flags.map((f) => (
          <div key={f.id} className={`queue-card sev-${f.severity}`}>
            <div className="row-between">
              <strong>{SEV_META[f.severity]?.icon} Student #{f.student_id}</strong>
              <span className="muted small">{SEV_META[f.severity]?.label}</span>
            </div>
            <p className="muted small">Driver: {f.primary_driver} · score {f.score}</p>
            <button className="stack-btn" onClick={() => setPending(f.student_id)}>👀 View context</button>
          </div>
        ))}

        {/* Demo entry point when there is no live DB-backed queue. */}
        <button className="stack-btn ghost" onClick={() => setPending(42)}>Demo: open context for student #42</button>
      </section>
    </main>
  );
}
