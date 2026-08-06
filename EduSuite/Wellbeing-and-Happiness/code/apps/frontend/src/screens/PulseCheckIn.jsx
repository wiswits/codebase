import React, { useState } from 'react';
import { api } from '../api.js';

// The 10-second daily pulse (PRD Part 5.1). Warm, bilingual, one tap.
// Rules: Skip is prominent, note optional, privacy note every time, no streak
// guilt, no score. If "struggling" is chosen, a gentle support sheet follows.

const MOODS = [
  { key: 'great', emoji: '😄', en: 'Great', hi: 'मस्त' },
  { key: 'good', emoji: '🙂', en: 'Good', hi: 'ठीक' },
  { key: 'okay', emoji: '😐', en: 'Okay', hi: 'चलता है' },
  { key: 'low', emoji: '😔', en: 'Low', hi: 'उदास' },
  { key: 'struggling', emoji: '😰', en: 'Struggling', hi: 'मुश्किल' },
];

export default function PulseCheckIn({ onCrisis, onOpenJournal, onOpenTalk, onOpenActivity }) {
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [struggling, setStruggling] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!mood) return;
    setBusy(true);
    try {
      const res = await api.submitPulse({ mood, note: note || undefined });
      if (res?.data?.crisis?.show_support_screen) {
        onCrisis?.(res.data.crisis);
        return;
      }
      if (mood === 'struggling') setStruggling(true);
      else setDone(true);
    } catch {
      // Fail soft — never block the child; still acknowledge.
      if (mood === 'struggling') setStruggling(true); else setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (struggling) {
    return (
      <section className="card center">
        <div className="big-emoji">😰</div>
        <h2>Samajh sakte hain</h2>
        <p className="muted">Mushkil din hote hain. Ye normal hai.</p>
        <p>Kuch madad chahiye?</p>
        <button className="stack-btn" onClick={onOpenActivity}>🫁 2 minute saans lete hain</button>
        <button className="stack-btn" onClick={onOpenTalk}>💬 Counsellor se baat karni hai</button>
        <button className="stack-btn" onClick={onOpenJournal}>📔 Diary me likhna hai</button>
        <button className="stack-btn ghost" onClick={() => setDone(true)}>Bas aaj ke liye itna hi</button>
      </section>
    );
  }

  if (done) {
    return (
      <section className="card center">
        <div className="big-emoji">✓</div>
        <h2>Shukriya</h2>
        <p className="muted">Kal phir milte hain. Koi jaldi nahi.</p>
      </section>
    );
  }

  return (
    <section className="card center">
      <h2 className="pulse-q">आज कैसा लग रहा है?</h2>
      <p className="muted">How are you feeling today?</p>

      <div className="mood-row" role="radiogroup" aria-label="Mood">
        {MOODS.map((m) => (
          <button
            key={m.key}
            className={`mood ${mood === m.key ? 'selected' : ''}`}
            role="radio"
            aria-checked={mood === m.key}
            aria-label={`${m.en} / ${m.hi}`}
            onClick={() => setMood(m.key)}
          >
            <span className="mood-emoji">{m.emoji}</span>
            <span className="mood-en">{m.en}</span>
            <span className="mood-hi">{m.hi}</span>
          </button>
        ))}
      </div>

      <textarea
        className="pulse-note"
        placeholder="Kuch kehna hai? (zaroori nahi)"
        maxLength={200}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <button className="primary-btn" disabled={!mood || busy} onClick={submit}>
        {busy ? '…' : 'Submit'}
      </button>
      <button className="skip-btn" onClick={() => setDone(true)}>Skip today →</button>

      <p className="privacy-note">🔒 Ye sirf tumhare liye hai. Koi teacher nahi dekhega.</p>
    </section>
  );
}
