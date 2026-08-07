import React, { useState } from 'react';

// Raise a concern (PRD Part 6.3) — the teacher's most valuable contribution.
// ⚠️ The teacher is NOT told the outcome (that's the child's privacy). The child
//    is never told who reported. This is not a discipline record.

const URGENCY = [
  ['watch', 'Bas dhyan rakhne layak'],
  ['this_week', 'Is hafte dekh lein'],
  ['soon', 'Jaldi dekhna chahiye'],
  ['urgent', '🚨 Abhi — mujhe darr lag raha hai'],
];

export default function RaiseConcern({ api }) {
  const [studentId, setStudentId] = useState('');
  const [note, setNote] = useState('');
  const [urgency, setUrgency] = useState('this_week');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  async function send() {
    setErr('');
    try {
      await api.raiseConcern({ student_id: Number(studentId), note, urgency });
      setSent(true);
    } catch (e) { setErr(e.message); }
  }

  if (sent) {
    return (
      <section className="card center">
        <div className="big-emoji">💚</div>
        <h2>Shukriya. Aapka dhyan dena hi bahut hai.</h2>
        <p className="muted">
          Sirf counsellor ko jaayega. Bachche ko nahi pata chalega ki aapne bataya.
          Ye discipline record nahi hai. Aapko outcome nahi bataya jaayega (privacy).
        </p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>💬 Counsellor ko batao</h2>
      <p className="muted">Aap roz bachchon ko dekhte hain. Aapki nazar kisi bhi algorithm se behtar hai.</p>

      <label className="field-label">Kis bachche ke baare me? (student id)</label>
      <input className="text-input" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g. 42" />

      <label className="field-label">Kya dekha? (jo bhi laga, likh dijiye)</label>
      <textarea className="pulse-note" rows={4} value={note} onChange={(e) => setNote(e.target.value)}
        placeholder="Pichle 2 hafte se chup hai. Lunch me akela baithta hai." />

      <fieldset className="field">
        <legend>Kitni jaldi lagta hai?</legend>
        {URGENCY.map(([v, label]) => (
          <label key={v} className="radio">
            <input type="radio" name="urg" checked={urgency === v} onChange={() => setUrgency(v)} /> {label}
          </label>
        ))}
      </fieldset>

      <button className="primary-btn" disabled={!studentId || !note.trim()} onClick={send}>Bhej do</button>
      {err && <p className="err-note">{err}</p>}

      <p className="privacy-note">
        🔒 Sirf counsellor ko · bachche ko nahi pata chalega · discipline record nahi · outcome nahi bataya jaayega
      </p>
    </section>
  );
}
