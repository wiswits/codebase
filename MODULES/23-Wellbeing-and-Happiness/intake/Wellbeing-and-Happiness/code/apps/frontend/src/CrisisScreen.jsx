import React, { useState } from 'react';

// The crisis screen (PRD Part 11.1).
//
// ⚠️ Ye screen chhupayi nahi ja sakti. This screen cannot be hidden.
//    No "later" button. No "X". The child must take an action — call, breathe,
//    or "main theek hoon". And even if they press "main theek hoon", the
//    counsellor already knows.
//
// Props:
//   level      'immediate' | 'urgent' | 'concern'
//   message    { title, body, cta, show_breathe }  (from the backend)
//   helplines  [{ name, number, hours, free }]     (always present)
//   onBreathe  () => void   open the breathing exercise
//   onImOkay   () => void   acknowledge — does NOT un-notify the counsellor
export default function CrisisScreen({ level = 'immediate', message, helplines = [], onBreathe, onImOkay }) {
  const [acted, setActed] = useState(false);
  const primary = helplines[0] || { name: 'Tele-MANAS', number: '14416', hours: '24×7' };
  const childline = helplines.find((h) => h.number === '1098');

  const msg = message || {
    title: 'Ruko. Ek minute.',
    body: 'Jo tumne likha, wo humne padha. Aur hum yahin hain.\n\nAbhi is waqt tum akele nahi ho.',
    show_breathe: level === 'immediate',
  };

  function act(fn) {
    setActed(true);
    fn && fn();
  }

  return (
    <div className="crisis-overlay" role="dialog" aria-modal="true" aria-label="Support">
      <div className="crisis-card">
        <h2 className="crisis-title">{msg.title}</h2>
        {msg.body.split('\n\n').map((para, i) => (
          <p key={i} className="crisis-body">{para}</p>
        ))}

        <a
          className="crisis-call primary"
          href={`tel:${primary.number}`}
          onClick={() => setActed(true)}
        >
          📞 {primary.name} · {primary.number}
          <small>{primary.hours} · muft · confidential</small>
        </a>

        {childline && (
          <a className="crisis-call" href={`tel:${childline.number}`} onClick={() => setActed(true)}>
            📞 Childline · {childline.number}<small>18 se kam umar ke liye</small>
          </a>
        )}

        <div className="crisis-reassure">
          💬 School counsellor ko bata diya hai. Wo tumse baat karengi.
        </div>

        {(msg.show_breathe ?? level === 'immediate') && (
          <button className="crisis-action" onClick={() => act(onBreathe)}>
            🫁 Abhi saath saans lete hain
          </button>
        )}

        <button className="crisis-okay" onClick={() => act(onImOkay)}>
          Main theek hoon
        </button>

        <p className="crisis-footer">
          Tum zaroori ho. Ye baat sach hai, chahe abhi aisa na lage.
          <br />Ye waqt guzar jaayega. Sach me.
        </p>

        {/* The only way "past" this screen is to take an action. There is no
            dismiss control — acknowledging still leaves the counsellor notified. */}
        {!acted && <span className="sr-only">Kripya koi ek option chuno.</span>}
      </div>
    </div>
  );
}
