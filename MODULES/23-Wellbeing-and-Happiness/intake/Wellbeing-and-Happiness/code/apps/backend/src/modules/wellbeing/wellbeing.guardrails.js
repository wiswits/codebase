// apps/backend/src/modules/wellbeing/wellbeing.guardrails.js
//
// ⚠️⚠️⚠️ READ THIS BEFORE TOUCHING ANYTHING ⚠️⚠️⚠️
//
// Ye constants nahi hain. Ye waade hain.
// These are not constants. These are promises.
//
// Har ek kisi ki galti se seekha gaya hai — kahin, kisi school me,
// kisi bachche ke saath. Hum wo galti dobara nahi karenge.
//
// To change ANYTHING in this file you need:
//   1. AK Sir ki likhit approval (written approval)
//   2. Licensed counsellor ki review
//   3. Reason document me likha jaaye
//
// "Client maang raha hai" reason nahi hai.
// "Zyada useful hoga" reason nahi hai.
// "Sirf ek exception" reason nahi hai.
//
// This file must NEVER move to config, an env var, or the DB.

const { GuardrailViolation, Forbidden, BadRequest } = require('./wellbeing.errors');

const WB_GUARDRAILS = Object.freeze({

  // ═══ PRIVACY ═══════════════════════════════════════════════

  MIN_AGGREGATE_SIZE: 5,
  // Fewer than 5 students → no aggregate at all.
  // Kyun: a class of 3 where "67% are sad" reveals 2 names.
  // This is the math of privacy, not an opinion.

  NEVER_JOIN_TABLES: Object.freeze([
    'client_exam_result',
    'client_pl_attempt',
    'client_pl_response',
    'client_pl_topic_score',
    'client_pl_weak_area',
    'client_fees',
    'client_fee_ledger',
    'client_discipline',
    'client_hostel_incident',
  ]),
  // These tables will NEVER be joined with wb_*.
  // Kyun: joining mood with marks creates the "sad students fail" narrative.
  // That narrative blames the child instead of helping.
  // Enforced: DB user grants + query linter + test suite.

  RED_FLAG_VISIBLE_TO: Object.freeze(['counsellor']),
  // Only the counsellor. Not principal. Not teacher. Not parent.

  JOURNAL_VISIBLE_TO: Object.freeze(['student_self']),
  // Only the author. Not even the counsellor, without explicit consent.

  PARENT_SEES_INDIVIDUAL_BY_DEFAULT: false,
  // Sometimes home is the problem. Counsellor decides case-by-case, logs reason.

  // ═══ RETENTION (days) ══════════════════════════════════════

  MOOD_RETENTION_DAYS: 365,        // then anonymize
  MOOD_RETENTION_DAYS_UNDER_13: 180,
  JOURNAL_RETENTION_DAYS: 730,     // student can delete anytime
  CASE_RETENTION_DAYS: 2555,       // 7 years, encrypted, counsellor-only
  AUDIT_RETENTION_DAYS: 2555,      // 7 years, never deleted

  // ═══ ANTI-HARM ═════════════════════════════════════════════

  NO_RANKING: true,               // no leaderboard, no "most stressed" list — endpoints don't exist
  NO_PUNISHMENT_LINK: true,       // no FK/API/export to discipline
  NO_PREDICTION: true,            // observe, never predict
  NO_DIAGNOSIS: true,             // "needs to talk", never "depression"

  // ═══ SIGNAL SAFETY ═════════════════════════════════════════

  ACADEMIC_SIGNAL_MAX_WEIGHT: 15,
  ATTENDANCE_SIGNAL_MAX_WEIGHT: 25,
  ACADEMIC_ALONE_CANNOT_RED: true,
  // Attendance(25) + academics(15) = 40 = amber. Red needs 60.
  // Marks dropping is not a crisis. Academic pressure ≠ mental-health crisis.

  SELF_RAISE_ALWAYS_RED: true,
  // Child says "I want to talk" → always red, always 24h SLA. Nothing else matters.

  // ═══ ACCOUNTABILITY ════════════════════════════════════════

  AUDIT_EVERY_READ: true,         // every individual read is logged, reason mandatory
  RED_FLAG_SLA_HOURS: 24,
  MAX_CASELOAD_PER_COUNSELLOR: 40,

  // ═══ CONSENT ═══════════════════════════════════════════════

  OPT_OUT_ALWAYS_AVAILABLE: true,
  OPT_OUT_ZERO_PENALTY: true,
  OPT_OUT_INVISIBLE_TO_STAFF: true,
  ASSENT_AGE: 13,                 // 13+ can give own assent (mood, journal)
  INDEPENDENT_CONSENT_AGE: 16,    // 16+ own choice, parent not notified by default

  // ═══ CRISIS ════════════════════════════════════════════════

  CRISIS_KEYWORDS_TRIGGER_IMMEDIATE: true,
  CRISIS_ALWAYS_SHOWS_HELPLINE: true,
  CRISIS_OVERRIDES_CONSENT: true, // life at risk = consent overridden, but logged with reason

  MIN_REASON_CHARS: 10,
});

// ═══════════════════════════════════════════════════════════════
// ENFORCEMENT — this is not just documentation
// ═══════════════════════════════════════════════════════════════

// 1. Query linter — check every wb_* query for a banned join.
function assertNoBannedJoin(sql) {
  if (typeof sql !== 'string') return;
  const lower = sql.toLowerCase();
  if (!lower.includes('wb_')) return;

  for (const banned of WB_GUARDRAILS.NEVER_JOIN_TABLES) {
    if (lower.includes(banned.toLowerCase())) {
      throw new GuardrailViolation(
        `FATAL: Attempted to join wb_* with ${banned}.\n` +
        `This violates Waada 1 — mood data never touches academic/financial data.\n` +
        `If you believe this is needed, stop and talk to AK Sir.`
      );
    }
  }
}

// 2. Aggregate guard — refuse to reveal numbers for tiny groups.
function assertAggregateSize(count) {
  if (count < WB_GUARDRAILS.MIN_AGGREGATE_SIZE) {
    return { insufficient_data: true, min_required: WB_GUARDRAILS.MIN_AGGREGATE_SIZE };
  }
  return null;
}

// 3. Role guard — only a counsellor sees individual data, and only with a reason.
//    `auditRead` is injected so this file has no DB dependency (keeps it pure/testable).
function assertCanSeeIndividual(role, actorId, subjectId, reason, auditRead) {
  if (!WB_GUARDRAILS.RED_FLAG_VISIBLE_TO.includes(role)) {
    throw new Forbidden(
      `Role "${role}" cannot access individual well-being data. ` +
      `Only ${WB_GUARDRAILS.RED_FLAG_VISIBLE_TO.join(', ')} can.`
    );
  }
  if (!reason || reason.trim().length < WB_GUARDRAILS.MIN_REASON_CHARS) {
    throw new BadRequest(
      `A reason (min ${WB_GUARDRAILS.MIN_REASON_CHARS} chars) is required to view individual data.`
    );
  }
  if (typeof auditRead === 'function') {
    auditRead({ actorId, subjectId, reason, at: new Date() });
  }
}

module.exports = {
  WB_GUARDRAILS,
  assertNoBannedJoin,
  assertAggregateSize,
  assertCanSeeIndividual,
};
