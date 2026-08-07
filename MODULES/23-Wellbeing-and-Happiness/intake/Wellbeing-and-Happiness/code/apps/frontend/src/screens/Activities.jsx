import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

// The activities library (PRD Part 5.4). Warm, short, evidence-based.
// Ratings improve activities — they never judge the student.

const ICONS = { breathe: '🫁', grounding: '🌍', gratitude: '🙏', reframe: '💭',
  meditate: '🧘', movement: '🏃', sleep: '😴', focus: '🎯', journal_prompt: '✍️' };

function title(a) {
  try { const t = typeof a.title_json === 'string' ? JSON.parse(a.title_json) : a.title_json;
    return t?.hi || t?.en || a.type; } catch { return a.type; }
}
function desc(a) {
  try { const d = typeof a.description_json === 'string' ? JSON.parse(a.description_json) : a.description_json;
    return d?.hi || d?.en || ''; } catch { return ''; }
}

export default function Activities() {
  const [items, setItems] = useState([]);
  const [doneId, setDoneId] = useState(null);

  useEffect(() => {
    api.listActivities().then((r) => setItems(r.data || [])).catch(() => setItems(FALLBACK));
  }, []);

  async function complete(a) {
    try { await api.completeActivity(a.id, {}); } catch { /* fail soft */ }
    setDoneId(a.id);
    setTimeout(() => setDoneId(null), 2000);
  }

  const list = items.length ? items : FALLBACK;

  return (
    <section className="card">
      <h2>🌱 Kuch Aasan Cheezein</h2>
      {list.map((a) => (
        <button key={a.id || a.content_id} className="activity" onClick={() => complete(a)}>
          <span className="activity-icon">{ICONS[a.type] || '🌱'}</span>
          <span className="activity-body">
            <strong>{title(a)}</strong>
            <span className="muted small">{desc(a)}</span>
          </span>
          <span className="activity-dur">{a.duration_min || 2} min</span>
          {doneId === (a.id || a.content_id) && <span className="ok-note">✓</span>}
        </button>
      ))}
    </section>
  );
}

// Shown if the API is unreachable — the list should never be empty.
const FALLBACK = [
  { content_id: 'breathe-478', type: 'breathe', duration_min: 2,
    title_json: { hi: '4-7-8 Saans' }, description_json: { hi: 'Ghabrahat kam karne ke liye' } },
  { content_id: 'ground-54321', type: 'grounding', duration_min: 3,
    title_json: { hi: '5-4-3-2-1 Grounding' }, description_json: { hi: 'Jab dimaag bhaag raha ho' } },
  { content_id: 'gratitude-3', type: 'gratitude', duration_min: 2,
    title_json: { hi: '3 Shukriya' }, description_json: { hi: 'Din ke ant me' } },
];
