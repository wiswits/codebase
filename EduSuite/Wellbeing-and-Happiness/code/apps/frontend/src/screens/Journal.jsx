import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

// The Journal — sacred space (PRD Part 5.2). "Hum bhi nahi padh sakte."
// Delete is prominent (hard delete). Sharing is the student's choice alone.

const PROMPTS = [
  'Aaj ki ek achhi baat kya thi?',
  'Kya cheez bhaari lag rahi hai?',
  'Kis baat ke liye shukriya kehna hai?',
];

export default function Journal() {
  const [body, setBody] = useState('');
  const [entries, setEntries] = useState([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try { setEntries((await api.listJournal()).data || []); } catch { /* keep quiet */ }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setError('');
    try {
      await api.createJournal({ body });
      setBody(''); setSaved(true); setTimeout(() => setSaved(false), 2500);
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(id) {
    await api.deleteJournal(id); load();
  }
  async function share(id) {
    await api.shareJournal(id); load();
  }

  return (
    <section className="card">
      <div className="row-between">
        <h2>📔 Meri Diary</h2>
        <span className="lock-chip">🔒 Private</span>
      </div>

      <textarea
        className="journal-area"
        placeholder="Aaj ka din..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
      />

      <p className="muted small">💡 Kuch likhne ka mann nahi? Try:</p>
      <div className="prompt-row">
        {PROMPTS.map((p) => (
          <button key={p} className="prompt" onClick={() => setBody((b) => (b ? b + '\n' : '') + p + ' ')}>
            {p}
          </button>
        ))}
      </div>

      <button className="primary-btn" disabled={!body.trim()} onClick={save}>Save</button>
      {saved && <p className="ok-note">✓ Save ho gaya.</p>}
      {error && <p className="err-note">{error}</p>}

      <p className="privacy-note">
        🔒 Ye sirf tumhari hai. Koi teacher nahi padh sakta. Counsellor bhi nahi. Hum bhi nahi.
      </p>

      {entries.length > 0 && (
        <div className="entries">
          <h3 className="muted small">Purani entries</h3>
          {entries.map((e) => (
            <div key={e.id} className="entry-row">
              <span className="muted small">
                {new Date(e.created_at).toLocaleDateString('hi-IN')} · {e.word_count || 0} words
                {e.shared_with_counsellor ? ' · shared' : ''}
              </span>
              <span className="entry-actions">
                {!e.shared_with_counsellor && (
                  <button className="link" onClick={() => share(e.id)}>share with counsellor</button>
                )}
                <button className="link danger" onClick={() => remove(e.id)}>🗑 delete</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
