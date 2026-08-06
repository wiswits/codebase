import React, { useEffect, useState } from 'react';

// ⚠️ Module invariant (PRD Part 11): a helpline is present on EVERY screen,
//    always, prominent — never hidden in a footer. This component is meant to
//    be rendered by the app shell so no screen can forget it.
export default function HelplineBar() {
  const [line, setLine] = useState({ name: 'Tele-MANAS', number: '14416', hours: '24×7' });

  useEffect(() => {
    fetch('/api/wb/helplines')
      .then((r) => r.json())
      .then((j) => j?.data?.[0] && setLine(j.data[0]))
      .catch(() => {}); // a network hiccup must never remove the helpline; keep the default
  }, []);

  return (
    <div className="helpline-bar" role="complementary" aria-label="Crisis helpline">
      <span aria-hidden>📞</span>
      <span>
        Abhi mushkil hai? <strong>{line.name} · {line.number}</strong> · {line.hours} · free
      </span>
      <a className="helpline-call" href={`tel:${line.number}`}>Call karo</a>
    </div>
  );
}
