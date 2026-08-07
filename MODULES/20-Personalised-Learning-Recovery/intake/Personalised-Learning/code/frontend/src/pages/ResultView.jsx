/* Result + per-question analysis after submit — shows correctness, the
   distractor misconception when wrong, and the behaviour classification
   (silly_mistake / concept_gap / overthinking / guess / …) per response. */

const BEHAVIOUR_LABEL = {
  silly_mistake: ['🚨 Silly mistake', 'var(--warn)'],
  concept_gap: ['📕 Concept gap', 'var(--bad)'],
  confused: ['🌀 Confused', 'var(--bad)'],
  guess: ['🎲 Guess', 'var(--bad)'],
  rushed: ['⚡ Rushed', 'var(--warn)'],
  overthinking: ['🔁 Overthinking', 'var(--warn)'],
  mastered: ['✅ Mastered', 'var(--good)'],
  solid: ['✅ Solid', 'var(--good)'],
  laboured: ['🐢 Laboured', 'var(--text-dim)'],
  lucky_guess: ['🍀 Lucky guess', 'var(--warn)'],
  skipped: ['⬜ Skipped', 'var(--text-faint)'],
};

export default function ResultView({ result, onRestart }) {
  if (!result) return null;
  const tone = result.percentage >= 70 ? 'good' : result.percentage >= 40 ? 'warn' : 'bad';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
      <div style={{ width: 460, maxWidth: '100%' }}>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: `var(--${tone})` }}>{result.percentage}%</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 4 }}>
            {result.score} / {result.max_score} marks · {result.correct_count} correct · {result.wrong_count} wrong · {result.skipped_count} skipped
          </div>
          {result.took_ms != null && <div style={{ color: 'var(--text-faint)', fontSize: 11, marginTop: 8 }}>Analysis ready in {result.took_ms} ms ⚡</div>}
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {result.review.map((r) => (
            <div key={r.seq} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Q{r.seq} · {r.wiswits_id}</span>
                <span style={{ fontSize: 12, color: r.is_correct ? 'var(--good)' : r.your_answer ? 'var(--bad)' : 'var(--text-faint)' }}>
                  {r.is_correct ? '✓ Correct' : r.your_answer ? '✗ Wrong' : '— Skipped'}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>{r.stem}</div>
              {!r.is_correct && r.misconception && (
                <div style={{ fontSize: 12, background: 'var(--warn-soft)', color: 'var(--warn)', borderRadius: 6, padding: '6px 8px', marginBottom: 6 }}>
                  💡 {r.misconception} ({r.distractor_reason})
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{r.solution}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 11, color: 'var(--text-faint)', flexWrap: 'wrap' }}>
                <span>⏱ {r.time_sec ?? '—'}s</span>
                <span>👁 {r.visits} visits</span>
                <span>🔁 {r.changed_count} changes</span>
                {BEHAVIOUR_LABEL[r.behaviour] && (
                  <span style={{ color: BEHAVIOUR_LABEL[r.behaviour][1], fontWeight: 600 }}>{BEHAVIOUR_LABEL[r.behaviour][0]}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={onRestart} style={{ marginTop: 16, width: '100%', minHeight: 44, borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          ↻ Try another attempt
        </button>
      </div>
    </div>
  );
}
