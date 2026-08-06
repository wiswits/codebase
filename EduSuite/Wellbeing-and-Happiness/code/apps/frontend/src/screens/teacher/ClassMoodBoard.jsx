import React, { useEffect, useState } from 'react';

// Class mood board — AGGREGATE ONLY (PRD Part 6.2). A teacher never sees an
// individual. When a class has fewer than 5 check-ins, the min-5 guard shows an
// explicit privacy screen instead of numbers — and that screen is a feature: it
// tells the teacher the system takes privacy seriously.

const MOOD_META = {
  great: { emoji: '😄', label: 'Great' }, good: { emoji: '🙂', label: 'Good' },
  okay: { emoji: '😐', label: 'Okay' }, low: { emoji: '😔', label: 'Low' },
  struggling: { emoji: '😰', label: 'Struggling' },
};
const ORDER = ['great', 'good', 'okay', 'low', 'struggling'];

export default function ClassMoodBoard({ api, onRaiseConcern }) {
  const [classId, setClassId] = useState('10-A');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load(id) {
    setLoading(true);
    try { setData((await api.classMood(id)).data); }
    catch { setData({ error: true }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(classId); }, []); // eslint-disable-line

  const total = data && data.mood_distribution
    ? Object.values(data.mood_distribution).reduce((a, b) => a + b, 0) : 0;

  return (
    <section className="card">
      <div className="row-between">
        <h2>Class Mood</h2>
        <select value={classId} onChange={(e) => { setClassId(e.target.value); load(e.target.value); }}>
          {['6-A', '9-B', '10-A', '11-A', '12-C'].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading && <p className="muted">…</p>}

      {/* ⚠️ The min-5 privacy screen. Visible on purpose. */}
      {data?.insufficient_data && (
        <div className="insufficient">
          <div className="big-emoji">🔒</div>
          <p><strong>Is class me abhi kaafi check-ins nahi hain.</strong></p>
          <p className="muted">
            Itni chhoti sankhya me aggregate dikhane se kisi ek bachche ka mood pata chal
            sakta hai. Isliye hum ye data nahi dikhate. Ye unki privacy hai — ye zaroori hai.
          </p>
          <button className="primary-btn" onClick={onRaiseConcern}>💬 Kisi ki chinta hai? Counsellor ko batao</button>
        </div>
      )}

      {data && !data.insufficient_data && !data.error && (
        <>
          <p className="muted small">{data.class_no}{data.section ? `-${data.section}` : ''} · {data.sample_size} checked in</p>
          <div className="mood-bars">
            {ORDER.map((k) => {
              const n = data.mood_distribution?.[k] || 0;
              const pct = total ? Math.round((n / total) * 100) : 0;
              return (
                <div key={k} className="mood-bar-row">
                  <span className="mood-bar-label">{MOOD_META[k].emoji} {MOOD_META[k].label}</span>
                  <span className="mood-bar-track"><span className="mood-bar-fill" style={{ width: `${pct}%` }} /></span>
                  <span className="mood-bar-n">{n || '—'}</span>
                </div>
              );
            })}
          </div>
          <p className="privacy-note">
            🔒 Ye poori class ka data hai. Kisi ek bachche ka mood aapko nahi dikhega — ye jaanbujh ke hai.
          </p>
          <button className="stack-btn" onClick={onRaiseConcern}>💬 Counsellor ko batao</button>
        </>
      )}

      {data?.error && <p className="muted">Abhi data load nahi ho paaya.</p>}
    </section>
  );
}
