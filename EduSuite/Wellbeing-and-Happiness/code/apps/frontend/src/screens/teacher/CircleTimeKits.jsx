import React, { useState } from 'react';

// Circle time kits (PRD Part 6.4) — 20-minute, no-training-needed sessions.
// Static content for now (the /circle-time API arrives later); the kit body
// carries the important guardrails: "Aap counsellor nahi hain" and the red-flag
// list of things to pass to the counsellor.

const KITS = [
  { id: 'exam', emoji: '😰', title: 'Exam Se Pehle', sub: 'Pressure ke baare me baat karna', classes: 'Class 8-12' },
  { id: 'friends', emoji: '🤝', title: 'Dosti Aur Ladai', sub: 'Rishte, jhagde, sulah', classes: 'Class 6-10' },
  { id: 'phone', emoji: '📱', title: 'Phone Aur Neend', sub: 'Screen time, sleep, dimaag', classes: 'Class 8-12' },
  { id: 'fail', emoji: '💪', title: 'Naakaamyabi', sub: 'Fail hona, phir uthna', classes: 'Class 9-12' },
];

const EXAM_KIT = {
  intro: 'Aap counsellor nahi hain. Aur banne ki zaroorat bhi nahi. Aapka kaam sirf ek safe jagah banana hai jahan bachche bol sakein.',
  steps: [
    ['0–2 min · Shuruaat', 'Circle me baitho. Phone side me. "Aaj marks ki baat nahi karenge. Sirf feelings ki."'],
    ['2–5 min · Warm up', '"Ek shabd me batao — exam ka naam sunte hi kya feel hota?" Aap bhi apna shabd bolein, pehle.'],
    ['5–12 min · Asli baat', '"Exam se pehle sabse mushkil kya lagta hai?" Sirf sunein. "Aisa mat socho" mat kahein.'],
    ['12–17 min · Ek cheez jo kaam karti hai', '4-7-8 saans sabko sikhao. "Exam hall me bhi kar sakte ho."'],
    ['17–20 min · Band karna', '"Ghabrana normal hai. Aur agar kabhi zyada ho jaye — counsellor hain. Ya mujhse bhi bol sakte ho."'],
  ],
  redFlags: [
    'Koi bole "mann karta hai sab khatam ho jaye"',
    'Koi ro pade aur ruk na paye',
    'Koi kahe ki ghar pe bahut pressure hai',
    'Koi bilkul chup rahe jab sab bol rahe hon',
  ],
  dont: ['Bolne pe majboor mat karo', '"Ye to kuch bhi nahi" mat bolo', 'Advice mat do — sirf suno'],
};

export default function CircleTimeKits({ onRaiseConcern }) {
  const [open, setOpen] = useState(null);

  if (open === 'exam') {
    return (
      <section className="card">
        <button className="link" onClick={() => setOpen(null)}>← Kits</button>
        <h2>😰 Exam Se Pehle · 20 min</h2>
        <div className="kit-warn">⚠️ Pehle padh lein: {EXAM_KIT.intro}</div>
        {EXAM_KIT.steps.map(([t, b]) => (
          <div key={t} className="kit-step"><strong>⏱ {t}</strong><p>{b}</p></div>
        ))}
        <div className="kit-flags">
          <strong>🚩 Agar ye dikhe, counsellor ko batayein:</strong>
          <ul>{EXAM_KIT.redFlags.map((f) => <li key={f}>{f}</li>)}</ul>
          <button className="stack-btn" onClick={onRaiseConcern}>💬 Counsellor ko batao</button>
        </div>
        <div className="kit-dont">
          <strong>❌ Ye MAT karna:</strong>
          <ul>{EXAM_KIT.dont.map((d) => <li key={d}>{d}</li>)}</ul>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>📖 Circle Time Kits</h2>
      <p className="muted small">Class ke saath 20 minute · Koi training nahi chahiye</p>
      {KITS.map((k) => (
        <button key={k.id} className="activity" onClick={() => setOpen(k.id === 'exam' ? 'exam' : null)}>
          <span className="activity-icon">{k.emoji}</span>
          <span className="activity-body"><strong>{k.title}</strong><span className="muted small">{k.sub} · {k.classes}</span></span>
          <span className="activity-dur">20 min</span>
        </button>
      ))}
      <p className="muted small">Abhi sirf "Exam Se Pehle" kit khul sakta hai (demo).</p>
    </section>
  );
}
