// wellbeing.engine.js
//
// Gathers the raw signals for a student and scores them. Data access is via
// injected `sources` so the engine is testable without a DB — and so it can
// NEVER reach an academic/financial table directly (Waada 1). All academic /
// attendance context arrives as pre-shaped signals from events, carrying a
// note, never marks.

const { wbDb } = require('../../config/db');
const { scoreFromSignals, SIGNAL_WEIGHTS } = require('./wellbeing.signals');
const { analyzePulsePattern } = require('./wellbeing.pulse');
const { isParticipating } = require('./wellbeing.consent');
const { WB_GUARDRAILS } = require('./wellbeing.guardrails');

// Turn a pulse pattern into the highest-applicable pulse signal (one only).
function pulseSignalsFromPattern(pattern) {
  const out = [];
  if (pattern.struggling_streak >= 2) {
    out.push({ source: 'pulse_struggling_2days', weight: SIGNAL_WEIGHTS.pulse_struggling_2days, detail: pattern });
  } else if (pattern.low_streak >= 5) {
    out.push({ source: 'pulse_low_5days', weight: SIGNAL_WEIGHTS.pulse_low_5days, detail: pattern });
  } else if (pattern.low_streak >= 3) {
    out.push({ source: 'pulse_low_3days', weight: SIGNAL_WEIGHTS.pulse_low_3days, detail: pattern });
  }
  if (pattern.sudden_drop) {
    out.push({ source: 'pulse_sudden_drop', weight: SIGNAL_WEIGHTS.pulse_sudden_drop, detail: pattern });
  }
  if (pattern.stopped_checking_in && pattern.was_regular) {
    out.push({ source: 'pulse_stopped', weight: SIGNAL_WEIGHTS.pulse_stopped,
               detail: { last_checkin: pattern.last_checkin } });
  }
  return out;
}

// sources (all optional, injectable):
//   getConsent, getRecentSelfRaise, getSharedJournalFlag, getHumanConcerns,
//   getRecentPulses, getStoredSignals (attendance/academic/hostel/weak from events)
async function computeSignals({ org_id, student_id }, sources = {}, now = new Date()) {
  const {
    getConsent, getRecentSelfRaise, getSharedJournalFlag,
    getHumanConcerns, getRecentPulses, getStoredSignals,
  } = sources;

  // ─── GATE 0: consent. Opted out = invisible, period. ───
  const consent = getConsent ? await getConsent({ org_id, student_id }) : null;
  if (!isParticipating(consent)) return null;

  const signals = [];

  // TIER 1 — the student's voice
  if (getRecentSelfRaise) {
    const sr = await getRecentSelfRaise({ org_id, student_id, days: 7 });
    if (sr) signals.push({ source: 'self_raise', weight: SIGNAL_WEIGHTS.self_raise, detail: { at: sr.at } });
  }
  if (getSharedJournalFlag) {
    const jf = await getSharedJournalFlag({ org_id, student_id, days: 7 });
    if (jf) signals.push({ source: 'journal_concern_flag', weight: SIGNAL_WEIGHTS.journal_concern_flag, detail: { at: jf.at } });
  }

  // TIER 2 — human observation
  if (getHumanConcerns) {
    for (const c of (await getHumanConcerns({ org_id, student_id, days: 14 })) || []) {
      signals.push({ source: c.source, weight: SIGNAL_WEIGHTS[c.source] ?? 30, detail: { by_role: c.role, at: c.at } });
    }
  }

  // TIER 3 — pulse patterns
  if (getRecentPulses) {
    const pulses = (await getRecentPulses({ org_id, student_id, days: 14 })) || [];
    signals.push(...pulseSignalsFromPattern(analyzePulsePattern(pulses, now)));
  }

  // TIERS 4 & 5 — stored signals from events (attendance/academic/hostel/weak).
  // ⚠️ These are already shaped as signals with capped weights and NO marks in
  //    their detail — the event subscriber guarantees that (Waada 1).
  if (getStoredSignals) {
    for (const s of (await getStoredSignals({ org_id, student_id })) || []) {
      let weight = s.weight;
      // defensive re-cap in case a bad row slipped in
      if (s.source === 'academic') weight = Math.min(weight, WB_GUARDRAILS.ACADEMIC_SIGNAL_MAX_WEIGHT);
      if (s.source === 'attendance') weight = Math.min(weight, WB_GUARDRAILS.ATTENDANCE_SIGNAL_MAX_WEIGHT);
      signals.push({ source: s.source, weight, detail: s.detail });
    }
  }

  return scoreFromSignals(signals);
}

module.exports = { computeSignals, pulseSignalsFromPattern };
