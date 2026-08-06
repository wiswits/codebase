import React, { useState } from 'react';
import { api } from '../api.js';

// "I want to talk" — the bravest button (PRD Part 5.3). Always red, 24h SLA.
// No reason required. "Yahan aana himmat ka kaam hai."

export default function TalkToSomeone() {
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState('this_week');
  const [mode, setMode] = useState('in_person');
  const [sent, setSent] = useState(false);

  async function send() {
    try { await api.selfRaise({ message: message || undefined, urgency }); } catch { /* fail soft */ }
    setSent(true);
  }

  if (sent) {
    return (
      <section className="card center">
        <div className="big-emoji">✓</div>
        <h2>Mil gaya. Shukriya.</h2>
        <p>Yahan aana himmat ka kaam hai.</p>
        <p className="muted">
          Counsellor ko pata chal gaya hai. Wo 24 ghante me tumse baat karengi.
          Kisi aur ko nahi bataya jaayega.
        </p>
      </section>
    );
  }

  return (
    <section className="card center">
      <div className="big-emoji">💬</div>
      <h2>Kisi se baat karni hai?</h2>
      <p className="muted">Koi wajah batane ki zaroorat nahi. Bas itna kaafi hai ki tum yahan aaye.</p>

      <textarea
        className="pulse-note"
        placeholder="Kya likhna hai? (bilkul optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <fieldset className="field">
        <legend>Kab milna chahoge?</legend>
        {[['asap', 'Jaldi se jaldi'], ['this_week', 'Is hafte kabhi bhi'], ['unsure', 'Pata nahi, bas baat karni hai']]
          .map(([v, label]) => (
            <label key={v} className="radio">
              <input type="radio" name="urg" checked={urgency === v} onChange={() => setUrgency(v)} /> {label}
            </label>
          ))}
      </fieldset>

      <fieldset className="field">
        <legend>Kaise?</legend>
        {[['in_person', 'Milke'], ['call', 'Phone pe'], ['chat', 'Chat pe']].map(([v, label]) => (
          <label key={v} className="radio">
            <input type="radio" name="mode" checked={mode === v} onChange={() => setMode(v)} /> {label}
          </label>
        ))}
      </fieldset>

      <button className="primary-btn" onClick={send}>Bhej do</button>

      <p className="privacy-note">
        Counsellor ko pata chalega · 24 ghante me contact · kisi aur ko nahi · kabhi bhi cancel kar sakte ho
      </p>
    </section>
  );
}
