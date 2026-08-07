// wellbeing.pulse.js
//
// The 10-second daily pulse. Two parts:
//   · analyzePulsePattern — PURE. Turns a list of pulses into a pattern summary
//     (streaks, sudden drop, went-quiet). Consumed by the signal engine (Week 5).
//   · submitPulse / getMyTrend — the service, consent-gated. An opted-out
//     student produces ZERO rows (Waada 5 / guardrail).

const { wbDb } = require('../../config/db');
const { isParticipating } = require('./wellbeing.consent');
const { BadRequest } = require('./wellbeing.errors');

const MOOD_RANK = Object.freeze({ great: 5, good: 4, okay: 3, low: 2, struggling: 1 });
const VALID_MOODS = Object.freeze(Object.keys(MOOD_RANK));

function daysBetween(a, b) {
  return Math.floor((new Date(b) - new Date(a)) / 86_400_000);
}
function mean(xs) {
  const nums = xs.filter((x) => typeof x === 'number' && !Number.isNaN(x));
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

// ─── PURE pattern analysis (PRD Part 4.3) ───────────────────────
function analyzePulsePattern(pulses, now = new Date()) {
  const sorted = [...pulses].sort((a, b) => new Date(b.date) - new Date(a.date));

  let lowStreak = 0, strugglingStreak = 0;
  for (const p of sorted) {
    if (p.mood === 'struggling') { strugglingStreak++; lowStreak++; }
    else if (p.mood === 'low') { strugglingStreak = 0; lowStreak++; }
    else break;
  }

  const suddenDrop = sorted.length >= 2 &&
    MOOD_RANK[sorted[1].mood] >= 4 && MOOD_RANK[sorted[0].mood] <= 2;

  const lastCheckin = sorted[0]?.date ?? null;
  const daysSince = lastCheckin ? daysBetween(lastCheckin, now) : 999;
  const wasRegular = pulses.length >= 5; // used to check in regularly

  return {
    low_streak: lowStreak,
    struggling_streak: strugglingStreak,
    sudden_drop: suddenDrop,
    stopped_checking_in: daysSince >= 7,
    was_regular: wasRegular,
    last_checkin: lastCheckin,
    avg_energy: mean(pulses.map((p) => p.energy_1_5)),
  };
}

// ─── The service ────────────────────────────────────────────────
// deps: { getConsent, scanForCrisis } — injected for testability.
// Returns { skipped:true } for an opted-out student — and writes NOTHING.
async function submitPulse({ org_id, student_id, mood, energy_1_5, note, context_tags, source },
                           deps = {}, db = wbDb) {
  const { getConsent, scanForCrisis } = deps;

  if (!VALID_MOODS.includes(mood)) {
    throw new BadRequest(`Invalid mood: ${mood}`);
  }

  const consent = getConsent ? await getConsent({ org_id, student_id }) : null;
  if (!isParticipating(consent)) {
    // ⚠️ Opted-out = invisible. No row. No trace. Silently accepted.
    return { skipped: true };
  }

  // ⚠️ A pulse note can carry a cry for help — scan it before anything else.
  // Crisis overrides consent, so this runs regardless. A hit still records the
  // pulse (below) but ALSO fires the full crisis path.
  let crisis = null;
  if (scanForCrisis && note) {
    crisis = await scanForCrisis({ org_id, student_id, text: note, source: 'pulse_note' });
  }

  const today = new Date().toISOString().slice(0, 10);
  await db.query(
    `INSERT INTO wb_pulse (org_id, student_id, date, mood, energy_1_5, note, context_tags_json, submitted_at, source)
     VALUES (?,?,?,?,?,?,?,NOW(),?)`,
    [org_id, student_id, today, mood, energy_1_5 ?? null, note ?? null,
     context_tags ? JSON.stringify(context_tags) : null, source || 'app']
  );

  return { skipped: false, crisis };
}

// A student's own trend (last N days). Self-only — enforced at the route.
async function getMyTrend({ org_id, student_id, days = 30 }, db = wbDb) {
  return db.query(
    `SELECT date, mood, energy_1_5, note, context_tags_json
       FROM wb_pulse
      WHERE org_id = ? AND student_id = ? AND date >= (CURDATE() - INTERVAL ? DAY)
      ORDER BY date DESC`,
    [org_id, student_id, days]
  );
}

module.exports = {
  MOOD_RANK, VALID_MOODS,
  analyzePulsePattern, submitPulse, getMyTrend,
  daysBetween, mean,
};
