import React, { useState } from 'react';

// Anonymous bullying / safety report (PRD Part 9). Public, no login.
// ⚠️ Anonymous ka matlab anonymous. The client sends only what the reporter
//    types — no identity, and the backend stores no IP/device/session. After
//    filing, the reporter gets a token to check status later.

const TYPES = [
  ['verbal', 'Zubaani (taunts, gaali)'], ['physical', 'Maar-peet'],
  ['social_exclusion', 'Alag-thalag karna'], ['cyber', 'Online / phone pe'],
  ['extortion', 'Paise/cheez cheenna'], ['discrimination', 'Bhedbhaav'], ['other', 'Kuch aur'],
];

export default function AnonymousReport({ orgId = 1 }) {
  const [incidentType, setIncidentType] = useState('verbal');
  const [description, setDescription] = useState('');
  const [classHint, setClassHint] = useState('');
  const [token, setToken] = useState(null);
  const [err, setErr] = useState('');

  async function file() {
    setErr('');
    try {
      // No auth headers on purpose — this is a public endpoint.
      const res = await fetch('/api/wb/report/bullying', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId, incident_type: incidentType,
          description, reporter_class_hint: classHint || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Report file nahi hui.');
      setToken(json.data.follow_up_token);
    } catch (e) { setErr(e.message); }
  }

  if (token) {
    return (
      <section className="card center">
        <div className="big-emoji">🕊</div>
        <h2>Mil gaya. Shukriya batane ke liye.</h2>
        <p className="muted">Counsellor is report ko dekhengi. Kisi ko nahi pata ki ye tumne bheji.</p>
        <p className="muted small">Status dekhne ke liye ye token sambhaal ke rakho:</p>
        <code className="token">{token}</code>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>🕊 Kuch galat ho raha hai?</h2>
      <p className="muted">
        Yahan bina naam ke bata sakte ho. Hum na tumhara naam poochhte hain, na phone,
        na kuch aur. Bas batao kya ho raha hai.
      </p>

      <label className="field-label">Kya ho raha hai?</label>
      <select className="text-input" value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
        {TYPES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
      </select>

      <label className="field-label">Thoda detail me (optional)</label>
      <textarea className="pulse-note" rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
        placeholder="Jo bhi bata sakte ho. Naam likhna zaroori nahi." />

      <label className="field-label">Kaunsi class ke aas-paas? (optional, moti si baat)</label>
      <input className="text-input" value={classHint} onChange={(e) => setClassHint(e.target.value)} placeholder="jaise: Class 9" />

      <button className="primary-btn" onClick={file}>Bhej do</button>
      {err && <p className="err-note">{err}</p>}

      <p className="privacy-note">
        🔒 No naam · no phone · no IP · no device. Ye jaanbujh ke hai. Anonymous ka matlab anonymous.
      </p>
    </section>
  );
}
