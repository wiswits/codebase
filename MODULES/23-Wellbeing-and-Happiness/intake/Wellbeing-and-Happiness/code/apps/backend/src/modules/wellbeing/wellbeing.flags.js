// wellbeing.flags.js
//
// Turns a score into a persisted flag. Green produces no flag. Amber nudges the
// student only. Red enters the counsellor queue (24h SLA) — and wb.flag_raised
// is emitted ONLY to the counsellor notification service (event bus restricted).
//
// ⚠️ RED flags are visible ONLY to the counsellor (WB_GUARDRAILS.RED_FLAG_VISIBLE_TO).

const { wbDb } = require('../../config/db');
const { computeSignals } = require('./wellbeing.engine');
const { scoreFromSignals, SIGNAL_WEIGHTS } = require('./wellbeing.signals');
const { WB_GUARDRAILS } = require('./wellbeing.guardrails');

// Persist/refresh a flag from a score result. Returns the flag row (or null for green).
async function upsertFlagFromScore({ org_id, student_id, score }, deps = {}, db = wbDb) {
  const { createFlag = require('./wellbeing.repo').createFlag, emit } = deps;

  if (score.severity === 'green') return null;

  const flag = await createFlag({
    org_id, student_id,
    severity: score.severity,
    score: score.total,
    signals_json: score.signals?.map((s) => ({ source: s.source, weight: s.weight })),
    primary_driver: score.primary_driver,
  }, db);

  if (score.severity === 'red' && emit) {
    // ⚠️ Restricted event — only the counsellor notification service subscribes.
    emit('wb.flag_raised', {
      org_id, student_id, severity: 'red',
      primary_driver: score.primary_driver, at: new Date(),
    });
  }
  return { id: flag.id, severity: score.severity, score: score.total, primary_driver: score.primary_driver };
}

// Full evaluate: gather → score → persist. Opted-out students yield null.
async function evaluateAndFlag({ org_id, student_id }, sources = {}, deps = {}, db = wbDb) {
  const score = await computeSignals({ org_id, student_id }, sources);
  if (!score) return { skipped: true }; // opted out
  const flag = await upsertFlagFromScore({ org_id, student_id, score }, deps, db);
  return { score, flag };
}

// ⭐ Self-raise: the bravest signal. ALWAYS red, ALWAYS 24h SLA, regardless of
// anything else. No scoring, no other signal can lower it.
async function raiseSelf({ org_id, student_id, message, urgency }, deps = {}, db = wbDb) {
  const score = scoreFromSignals([{ source: 'self_raise', weight: SIGNAL_WEIGHTS.self_raise,
                                    detail: { message, urgency } }]);
  // score.severity is 'red' by construction — assert the promise holds.
  if (score.severity !== 'red' || !WB_GUARDRAILS.SELF_RAISE_ALWAYS_RED) {
    throw new Error('Guardrail violation: self-raise did not produce red.');
  }
  const flag = await upsertFlagFromScore({ org_id, student_id, score }, deps, db);
  if (deps.emit) deps.emit('wb.self_raised', { org_id, student_id, urgency, at: new Date() });
  return { flag, sla_hours: WB_GUARDRAILS.RED_FLAG_SLA_HOURS };
}

module.exports = { upsertFlagFromScore, evaluateAndFlag, raiseSelf };
