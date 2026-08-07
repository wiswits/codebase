// wellbeing.signals.js
//
// ⚠️ Ye engine DIAGNOSIS nahi karta. PREDICT nahi karta. DECIDE nahi karta.
//    This engine does not diagnose, predict, or decide. It only says:
//    "Kuch alag lag raha hai. Ek insaan dekh le." — something looks different,
//    let a human look. Everything else is done by a human.
//
// ⭐ Thresholds are SENSITIVE, not specific. A false positive costs a counsellor
//    10 minutes. A false negative costs something we cannot fix. So: more amber
//    is fine; a miss is not.
//
// ⚠️ The weights and caps here were set by AK Sir + a licensed counsellor.
//    Do not "tune" them without that review. Every number has a reason.

const { WB_GUARDRAILS } = require('./wellbeing.guardrails');

const SIGNAL_WEIGHTS = Object.freeze({
  // ═══ TIER 1 — the student's own voice (nothing beats this) ══
  self_raise: 100,             // "mujhe baat karni hai" → always red, now
  crisis_keyword: 100,         // handled by the crisis path; also weighs 100
  journal_concern_flag: 90,    // student shares a journal entry with counsellor

  // ═══ TIER 2 — human observation ════════════════════════════
  teacher_concern: 40,
  warden_concern: 40,
  counsellor_observation: 45,
  peer_report: 35,

  // ═══ TIER 3 — pulse patterns ═══════════════════════════════
  pulse_struggling_1day: 15,
  pulse_low_3days: 30,
  pulse_low_5days: 45,
  pulse_struggling_2days: 50,
  pulse_sudden_drop: 25,
  pulse_stopped: 20,

  // ═══ TIER 4 — behavioural (ALWAYS light, hard-capped) ══════
  attendance_absent_3: 25,     // ⚠️ MAX 25
  attendance_absent_5: 25,     // same cap
  attendance_pattern_change: 15,
  score_drop_20pct: 15,        // ⚠️ MAX 15 — the most important cap
  score_drop_sustained: 15,

  // ═══ TIER 5 — weak signals (context only) ══════════════════
  library_pattern_change: 5,
  bus_pattern_change: 5,
  activity_stopped: 8,
  social_withdrawal: 10,
});

const THRESHOLDS = Object.freeze({
  GREEN: { min: 0, max: 29, action: 'none' },
  AMBER: { min: 30, max: 59, action: 'gentle_nudge_to_student_only' },
  RED: { min: 60, max: 999, action: 'counsellor_queue_24h_sla' },
});

const CAPS = Object.freeze({
  // ⚠️⚠️ The most important rule in the module.
  // Attendance(25) + Academics(15) = 40 = AMBER. Red needs 60.
  // So attendance + marks ALONE can never produce a red flag.
  BEHAVIOURAL_MAX_COMBINED: 40,
  WEAK_SIGNALS_MAX_COMBINED: 20,
});

// Classification helpers.
const TIER12 = new Set(['self_raise', 'crisis_keyword', 'journal_concern_flag',
  'teacher_concern', 'warden_concern', 'counsellor_observation', 'peer_report']);
const BEHAVIOURAL = new Set(['attendance_absent_3', 'attendance_absent_5',
  'attendance_pattern_change', 'score_drop_20pct', 'score_drop_sustained', 'attendance', 'academic']);
const ACADEMIC = new Set(['score_drop_20pct', 'score_drop_sustained', 'academic']);
const WEAK = new Set(['library_pattern_change', 'bus_pattern_change', 'activity_stopped', 'social_withdrawal']);

function isPulse(source) { return source.startsWith('pulse_'); }

// ─── PURE scorer ────────────────────────────────────────────────
// Input: [{ source, weight, detail? }]. Output: { total, severity,
// primary_driver, breakdown, signals }. This is the guardrail-critical core.
function scoreFromSignals(signals) {
  let tier12 = 0, tier3 = 0, behavioural = 0, weak = 0;

  for (const s of signals) {
    if (TIER12.has(s.source)) tier12 += s.weight;
    else if (isPulse(s.source)) tier3 += s.weight;
    else if (BEHAVIOURAL.has(s.source)) behavioural += s.weight;
    else if (WEAK.has(s.source)) weak += s.weight;
    // unknown sources are ignored on purpose (fail safe, not loud)
  }

  // ⚠️ Hard caps. Behavioural (attendance+academics) can never exceed 40.
  behavioural = Math.min(behavioural, CAPS.BEHAVIOURAL_MAX_COMBINED);
  weak = Math.min(weak, CAPS.WEAK_SIGNALS_MAX_COMBINED);

  const total = tier12 + tier3 + behavioural + weak;

  // ─── severity ───
  let severity;
  const hasVoice = signals.some((s) => s.source === 'self_raise' || s.source === 'crisis_keyword');
  if (hasVoice) {
    severity = 'red';                                   // ⭐ always, no exceptions
  } else if (total >= THRESHOLDS.RED.min) {
    const nonBehavioural = tier12 + tier3;              // real drivers
    if (nonBehavioural === 0 && WB_GUARDRAILS.ACADEMIC_ALONE_CANNOT_RED) {
      severity = 'amber';                               // ⚠️ downgrade — academics alone never red
    } else {
      severity = 'red';
    }
  } else if (total >= THRESHOLDS.AMBER.min) {
    severity = 'amber';
  } else {
    severity = 'green';
  }

  const primary_driver = signals.length
    ? [...signals].sort((a, b) => b.weight - a.weight)[0].source
    : null;

  return {
    total, severity, primary_driver,
    breakdown: { tier12, tier3, behavioural, weak },
    signals,
    computed_at: new Date(),
  };
}

// ─── convenience: score from boolean flags (matches PRD Part 1.3 test) ──
// e.g. compute({ self_raise: true }) or compute({ score_drop_20pct: true, attendance_absent_3: true })
function compute(flags = {}) {
  const signals = [];
  for (const [key, on] of Object.entries(flags)) {
    if (!on) continue;
    let source = key;
    let weight = SIGNAL_WEIGHTS[key];
    if (weight == null) continue;
    // apply the per-signal hard caps defensively
    if (ACADEMIC.has(source)) weight = Math.min(weight, WB_GUARDRAILS.ACADEMIC_SIGNAL_MAX_WEIGHT);
    if (source.startsWith('attendance')) weight = Math.min(weight, WB_GUARDRAILS.ATTENDANCE_SIGNAL_MAX_WEIGHT);
    signals.push({ source, weight });
  }
  return scoreFromSignals(signals);
}

module.exports = {
  SIGNAL_WEIGHTS, THRESHOLDS, CAPS,
  TIER12, BEHAVIOURAL, ACADEMIC, WEAK,
  scoreFromSignals, compute, isPulse,
};
