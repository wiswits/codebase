/* ⭐⭐⭐ Root Cause — live call to POST /api/pl/analyze/weak-areas.
   Shows the "money example": Ch07 weak → but Ch01 is the root. */

import { useState } from 'react';
import { Panel } from '../components/ui.jsx';

const SAMPLE = {
  now: '2026-07-16T00:00:00Z',
  topics: [
    { wiswits_id: 'MATH10C07T01', subject_id: 1, attempted: 8, accuracy: 28, last_attempt_at: '2026-07-14T00:00:00Z', variance: 5 },
    { wiswits_id: 'MATH10C03T02', subject_id: 1, attempted: 8, accuracy: 34, last_attempt_at: '2026-07-14T00:00:00Z', variance: 5 },
    { wiswits_id: 'MATH10C01T02', subject_id: 1, attempted: 8, accuracy: 41, last_attempt_at: '2026-07-14T00:00:00Z', variance: 5 },
  ],
};

const NAMES = {
  MATH10C01T02: 'Ch01 · Real Numbers',
  MATH10C03T02: 'Ch03 · Polynomials',
  MATH10C07T01: 'Ch07 · Quadratic Equations',
};

export default function RootCauseDemo() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch('/api/pl/analyze/weak-areas', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-role': 'teacher', 'x-org-id': '1' },
        body: JSON.stringify(SAMPLE),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const root = data?.weak_areas.find((w) => w.is_root_cause);
  const chain = root ? [...data.weak_areas].sort((a, b) => a.depth_from_root - b.depth_from_root) : [];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>🎯 Root Cause Analysis</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>
          Aarav ke 3 weak topics backend ko bhejo. System batayega asli jadd kahan hai.
        </p>
      </div>

      <Panel
        title="Input · Aarav's weak topics"
        action={
          <button
            onClick={run}
            disabled={loading}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            {loading ? 'Analyzing…' : 'Run analysis →'}
          </button>
        }
      >
        <div style={{ display: 'grid', gap: 8 }}>
          {SAMPLE.topics.map((t) => (
            <div key={t.wiswits_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: 'var(--mono)' }}>
              <span>{NAMES[t.wiswits_id]}</span>
              <span style={{ color: 'var(--bad)' }}>{t.accuracy}%</span>
            </div>
          ))}
        </div>
      </Panel>

      {err && <Panel><span style={{ color: 'var(--bad)' }}>⚠️ {err} — is the backend running on :4010?</span></Panel>}

      {root && (
        <Panel title="Diagnosis">
          <div style={{ display: 'grid', gap: 0, justifyItems: 'center' }}>
            {chain.map((w, i) => (
              <div key={w.wiswits_id} style={{ display: 'grid', justifyItems: 'center', gap: 0 }}>
                <div
                  style={{
                    border: `2px solid var(--${w.is_root_cause ? 'bad' : 'border'})`,
                    background: w.is_root_cause ? 'var(--bad-soft)' : 'var(--panel-2)',
                    borderRadius: 'var(--radius)',
                    padding: '14px 20px',
                    minWidth: 320,
                    textAlign: 'center',
                  }}
                >
                  {w.is_root_cause && <div style={{ color: 'var(--bad)', fontWeight: 700, fontSize: 12, marginBottom: 4 }}>🚨 ROOT CAUSE — START HERE</div>}
                  <div style={{ fontWeight: 600 }}>{NAMES[w.wiswits_id] || w.wiswits_id}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 2 }}>
                    {w.accuracy}% · confidence {w.confidence} · depth {w.depth_from_root}
                    {!w.is_root_cause && ' · symptom'}
                  </div>
                </div>
                {i < chain.length - 1 && <div style={{ color: 'var(--text-faint)', padding: '6px 0' }}>│ enables ▼</div>}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, padding: 16, background: 'var(--good-soft)', borderRadius: 'var(--radius-sm)', fontSize: 14, lineHeight: 1.6 }}>
            💡 {NAMES[chain.at(-1)?.wiswits_id]?.split('·')[0]?.trim()} pe practice mat karo. {NAMES[root.wiswits_id].split('·')[0].trim()} se shuru karo.<br />
            Root ko 70% pe le jao → dependents apne aap sudhrenge.<br />
            <strong>Estimated: 2 weeks (vs 8 weeks agar symptom chase karte rahe).</strong>
          </div>
        </Panel>
      )}
    </div>
  );
}
