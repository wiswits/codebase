import React, { useState } from 'react';

// Looping in a parent (PRD Part 7.3) — the hardest decision. The friction here
// is intentional: a checklist, the child's response, and a MANDATORY written
// reason. If the child says no, a concrete safety reason is required.
// ⚠️ Mood data, journal, and session notes are NEVER shared — chahe kuch bhi ho.

const CHECKS = [
  'Maine bachche se poocha hai',
  'Mujhe koi wajah nahi dikhti ki ghar unsafe ho',
  'Ye batana bachche ki madad karega, school ki zimmedari nahi',
];

export default function ParentLoopIn({ api, caseId, onDone, onCancel }) {
  const [checked, setChecked] = useState({});
  const [childResponse, setChildResponse] = useState('agreed');
  const [reason, setReason] = useState('');
  const [safetyReason, setSafetyReason] = useState('');
  const [whatToShare, setWhatToShare] = useState('general');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const refusing = childResponse === 'refusing';
  const allChecked = CHECKS.every((_, i) => checked[i]);
  const canSubmit = allChecked && reason.trim().length >= 10 && (!refusing || safetyReason.trim().length >= 10);

  async function submit() {
    setErr('');
    try {
      await api.loopInParent(caseId, {
        child_response: childResponse,
        reason: refusing ? `${reason.trim()} | SAFETY: ${safetyReason.trim()}` : reason.trim(),
        what_to_share: whatToShare,
      });
      setDone(true);
    } catch (e) { setErr(e.message); }
  }

  if (done) {
    return (
      <section className="card center">
        <div className="big-emoji">✓</div>
        <h2>Log ho gaya.</h2>
        <p className="muted">Aapka naam, wajah, aur bachche ka jawab record me hai.</p>
        <button className="primary-btn" onClick={onDone}>Wapas</button>
      </section>
    );
  }

  return (
    <section className="card" style={{ textAlign: 'left' }}>
      <button className="link" onClick={onCancel}>← Cancel</button>
      <h2>👨‍👩‍👧 Ghar Walon Ko Batana Hai?</h2>
      <div className="kit-warn">
        ⚠️ Ruk jaiye. Ye sabse bada faisla hai. Zyadatar parents madad karna chahte hain. Par
        kabhi kabhi ghar hi wo jagah hai jahan se dard aa raha hai.
      </div>

      <div className="checklist">
        {CHECKS.map((c, i) => (
          <label key={i} className="radio">
            <input type="checkbox" checked={!!checked[i]} onChange={(e) => setChecked({ ...checked, [i]: e.target.checked })} /> {c}
          </label>
        ))}
      </div>

      <fieldset className="field">
        <legend>Bachcha kya kehta hai?</legend>
        {[['agreed', 'Maan gaya'], ['hesitant', 'Maan gaya, par jhijhak raha hai'], ['refusing', 'Mana kar raha hai']]
          .map(([v, label]) => (
            <label key={v} className="radio">
              <input type="radio" name="cr" checked={childResponse === v} onChange={() => setChildResponse(v)} /> {label}
            </label>
          ))}
      </fieldset>

      <label className="field-label">Kyun batana zaroori hai? (likhna zaroori hai)</label>
      <textarea className="pulse-note" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />

      {refusing && (
        <div className="kit-flags">
          <label className="field-label">⚠️ Bachcha mana kar raha hai — safety ki thos wajah? (specific)</label>
          <textarea className="pulse-note" rows={2} value={safetyReason} onChange={(e) => setSafetyReason(e.target.value)} />
        </div>
      )}

      <fieldset className="field">
        <legend>Kya batayenge?</legend>
        {[['minimal', 'Sirf "school se baat karni hai"'], ['general', 'Aam si baat: "kuch dhyan dene layak laga"'],
          ['detail', 'Detail me (sirf agar bachcha maan gaya ho)']].map(([v, label]) => (
            <label key={v} className="radio">
              <input type="radio" name="share" checked={whatToShare === v} onChange={() => setWhatToShare(v)} /> {label}
            </label>
          ))}
      </fieldset>

      <p className="muted small">⚠️ Bachche ka mood data, journal, ya session notes kabhi share nahi honge.</p>

      <div className="consent-actions">
        <button className="consent-btn" onClick={onCancel}>Abhi nahi</button>
        <button className="consent-btn" style={{ background: canSubmit ? 'var(--accent)' : undefined, color: canSubmit ? '#fff' : undefined }}
          disabled={!canSubmit} onClick={submit}>Ghar walon ko batao</button>
      </div>
      {err && <p className="err-note">{err}</p>}
      <p className="muted small">💡 Confused hain? Kisi senior se baat kar lein. Jaldi karne ki koi wajah nahi (jab tak safety issue na ho).</p>
    </section>
  );
}
