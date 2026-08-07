import React, { useState } from 'react';

// The reason gate (PRD Part 7.2). ⚠️ Every context view — even the counsellor's —
// requires a written reason (min 10 chars). This friction is intentional: a
// second's pause, a line of thought, so access never feels casual. The reason
// is logged forever.

export default function ReasonModal({ onCancel, onContinue }) {
  const [reason, setReason] = useState('');
  const ok = reason.trim().length >= 10;

  return (
    <div className="crisis-overlay" role="dialog" aria-modal="true" aria-label="Reason required">
      <div className="crisis-card" style={{ textAlign: 'left' }}>
        <h2 className="center">🔒 Ek Minute</h2>
        <p>Aap ek bachche ka personal data dekhne ja rahi hain.</p>
        <p className="muted">Ye access log hoga. Hamesha ke liye. Ye theek hai — ye accountability hai.</p>
        <label className="field-label">Bas ek line likh dijiye — kyun dekh rahi hain?</label>
        <textarea className="pulse-note" rows={3} value={reason} autoFocus
          onChange={(e) => setReason(e.target.value)}
          placeholder="Red flag 15 Jul, first contact prep" />
        {!ok && reason.length > 0 && <p className="muted small">Kam se kam 10 akshar.</p>}
        <div className="consent-actions">
          <button className="consent-btn" onClick={onCancel}>Cancel</button>
          <button className="consent-btn" style={{ background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}
            disabled={!ok} onClick={() => onContinue(reason.trim())}>Continue</button>
        </div>
      </div>
    </div>
  );
}
