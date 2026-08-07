import React, { useState } from 'react';
import { api } from '../api.js';

// The consent screen (PRD Part 2.2). The five promises, in plain words.
// ⚠️ "Abhi nahi" is EXACTLY as prominent as "Theek hai" — this is on purpose.
//    Consent is only real when saying no is easy.

const PROMISES = [
  'Tumhara mood tumhare marks se KABHI nahi judega',
  'Tumhare teacher ko tumhara mood NAHI dikhega',
  'Tumhari diary sirf TUMHARI hai — koi nahi padh sakta',
  'Ye kabhi saza ka zariya NAHI banega',
  "Tum kabhi bhi 'na' keh sakte ho — kuch nahi hoga",
];

export default function ConsentScreen({ onDecided }) {
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    try {
      // Age band would come from the student's profile in production; demo 13_15.
      await api.putConsent({ age_band: '13_15', participates: true, student_assent_at: new Date().toISOString() });
    } catch { /* fail soft */ }
    setBusy(false);
    onDecided?.(true);
  }

  async function notNow() {
    setBusy(true);
    try { await api.optOut({}); } catch { /* fail soft */ }
    setBusy(false);
    onDecided?.(false);
  }

  return (
    <section className="card consent">
      <h2 className="center">🌱 Ek Choti Si Baat</h2>
      <p>Humein pata hai school ka time mushkil ho sakta hai. Kabhi achha lagta hai, kabhi nahi.</p>
      <p>Hum bas ye chahte hain ki agar kabhi tumhe kisi se baat karne ka mann ho, to koi ho.</p>

      <div className="promise-box">
        <p className="promise-head">🔒 Ye promise hai — hum tod nahi sakte:</p>
        <ul>
          {PROMISES.map((p) => <li key={p}>✓ {p}</li>)}
        </ul>
      </div>

      <p className="muted small">
        ⚠️ Ek exception, aur sirf ek: agar kabhi lage ki tum khatre me ho — tab hum madad bulayenge.
        Kyunki tum zaroori ho. Rules se zyada.
      </p>

      {/* Both buttons are the SAME size and weight — deliberately. */}
      <div className="consent-actions">
        <button className="consent-btn" disabled={busy} onClick={accept}>Theek hai</button>
        <button className="consent-btn" disabled={busy} onClick={notNow}>Abhi nahi</button>
      </div>
      <p className="muted small center">
        "Abhi nahi" bilkul theek hai. Kabhi bhi badal sakte ho. Aur kisi ko pata bhi nahi chalega.
      </p>
    </section>
  );
}
