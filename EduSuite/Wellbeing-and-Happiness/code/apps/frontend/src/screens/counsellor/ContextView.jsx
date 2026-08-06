import React from 'react';

// The context view (PRD Part 7.2). "You're here for him, not his file."
// Shows the flag + signals, mood trend, concerns, a LOCKED journal panel, case
// history, and the explicit "what you cannot see" block. Data comes from the
// reason-gated, audited backend endpoint.

const MOOD_ROWS = ['great', 'good', 'okay', 'low', 'struggling'];

export default function ContextView({ data, reason, onBack, onLoopInParent }) {
  if (!data) return null;
  let signals = [];
  try { signals = data.flag?.signals_json
    ? (typeof data.flag.signals_json === 'string' ? JSON.parse(data.flag.signals_json) : data.flag.signals_json)
    : []; } catch { signals = []; }

  return (
    <section className="card" style={{ textAlign: 'left' }}>
      <button className="link" onClick={onBack}>← Queue</button>
      <div className="viewing-banner">🔒 Viewing logged · Reason: "{reason}"</div>

      {data.flag && (
        <div className={`flag-box sev-${data.flag.severity}`}>
          <strong>{data.flag.severity?.toUpperCase()} · Score {data.flag.score}</strong>
          <p className="muted small">Primary driver: {data.flag.primary_driver}</p>
          <ul className="signal-list">
            {signals.map((s, i) => <li key={i}>{s.source} · {s.weight}</li>)}
          </ul>
          <p className="muted small">⚠️ {data.mood?.note}</p>
        </div>
      )}

      <h3>📊 Mood (last 14 days)</h3>
      {data.mood?.pulses?.length
        ? <div className="mini-trend">{data.mood.pulses.map((p, i) => (
            <span key={i} className={`dot m-${p.mood}`} title={`${p.date}: ${p.mood}`} />))}</div>
        : <p className="muted small">No recent check-ins.</p>}

      <h3>👨‍🏫 Concerns</h3>
      {data.concerns?.length
        ? data.concerns.map((c, i) => <p key={i} className="concern-line">{c.source}</p>)
        : <p className="muted small">None on record.</p>}

      {/* ⚠️ Journal is LOCKED unless the student shared. */}
      <h3>📔 Journal</h3>
      <div className="journal-locked">
        <div className="big-emoji">🔒</div>
        <p>{data.journal?.total ?? 0} entries · {data.journal?.shared ?? 0} shared with you</p>
        <p className="muted small">{data.journal?.note}</p>
      </div>

      <h3>⚠️ What you cannot see</h3>
      <ul className="cannot-see">
        {(data.what_you_cannot_see || []).map((w) => <li key={w}>{w}</li>)}
      </ul>
      <p className="muted small">This is intentional. You're here for them, not their file.</p>

      <div className="ctx-actions">
        <button className="stack-btn" onClick={onLoopInParent}>👨‍👩‍👧 Loop in parent</button>
      </div>
    </section>
  );
}
