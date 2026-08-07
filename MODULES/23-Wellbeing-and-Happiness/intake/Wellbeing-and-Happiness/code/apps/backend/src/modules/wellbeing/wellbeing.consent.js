// wellbeing.consent.js
//
// The consent ladder (PRD Part 2.1). Consent is only real when saying "no" is
// easy — so opt-out is one tap, zero penalty, invisible to staff. These are not
// UX niceties; they are guardrails (WB_GUARDRAILS.OPT_OUT_*).
//
// This module is the PURE policy: given an age, what is required, what is
// enabled, how long we keep data. The API/DB layer (later in Week 2) calls it.

const { WB_GUARDRAILS } = require('./wellbeing.guardrails');

const AGE_BANDS = Object.freeze(['under_13', '13_15', '16_17', '18_plus']);

// Whole years between dob and `on` (default now).
function ageInYears(dob, on = new Date()) {
  const b = new Date(dob);
  let age = on.getFullYear() - b.getFullYear();
  const m = on.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < b.getDate())) age--;
  return age;
}

function ageBandFor(dob, on = new Date()) {
  const age = ageInYears(dob, on);
  if (age < WB_GUARDRAILS.ASSENT_AGE) return 'under_13';             // < 13
  if (age < WB_GUARDRAILS.INDEPENDENT_CONSENT_AGE) return '13_15';   // 13–15
  if (age < 18) return '16_17';                                      // 16–17
  return '18_plus';                                                  // 18+
}

// The policy for a band. Every field maps directly to the PRD ladder table.
function consentPolicy(ageBand) {
  switch (ageBand) {
    case 'under_13':
      return {
        parent_consent: 'required',
        student_assent: 'required',        // simple language
        journal_enabled: false,            // too young for a private space
        pulse: 'emoji_only',               // no free-text note
        self_raise: true,                  // always available
        parent_sees_individual: 'counsellor_decides',
        retention_days: WB_GUARDRAILS.MOOD_RETENTION_DAYS_UNDER_13, // 180
      };
    case '13_15':
      return {
        parent_consent: 'required',        // informed, can withdraw
        student_assent: 'required',        // can withdraw independently
        journal_enabled: true,             // encrypted, student-only
        pulse: 'full',                     // with optional note
        self_raise: true,
        parent_sees_individual: 'counsellor_decides_logs_reason',
        retention_days: WB_GUARDRAILS.MOOD_RETENTION_DAYS,          // 365
      };
    case '16_17':
      return {
        parent_consent: 'notified_not_required',
        student_assent: 'required',        // independent
        journal_enabled: true,
        pulse: 'full',
        self_raise: true,
        parent_sees_individual: 'student_consent_or_safety',
        retention_days: WB_GUARDRAILS.MOOD_RETENTION_DAYS,
      };
    case '18_plus':
      return {
        parent_consent: 'not_applicable',
        student_assent: 'required',        // fully independent
        journal_enabled: true,
        pulse: 'full',
        self_raise: true,
        parent_sees_individual: 'never_without_explicit_consent', // safety exception only
        retention_days: WB_GUARDRAILS.MOOD_RETENTION_DAYS,
      };
    default:
      throw new Error(`Unknown age band: ${ageBand}`);
  }
}

// Is this student currently participating? Opt-out wins over everything.
// (An opted-out student is invisible; the signal engine already gates on this.)
function isParticipating(consentRow) {
  if (!consentRow) return false;
  if (consentRow.opted_out_at) return false;
  return !!consentRow.participates;
}

// Whether all required consents/assents are satisfied for the band.
function hasRequiredConsent(consentRow, ageBand) {
  const policy = consentPolicy(ageBand);
  const parentOk = policy.parent_consent !== 'required' || !!consentRow?.parent_consent_at;
  const assentOk = policy.student_assent !== 'required' || !!consentRow?.student_assent_at;
  return parentOk && assentOk;
}

// Opt-out is always available, one step, zero penalty. Returns the fields to
// persist; the caller writes them and (separately) schedules anonymization.
// ⚠️ No confirmation-nag, no reason requirement — reason is optional.
function buildOptOut({ reason } = {}) {
  return {
    participates: 0,
    opted_out_at: new Date(),
    opt_out_reason: reason?.trim() ? reason.trim().slice(0, 255) : null,
  };
}

module.exports = {
  AGE_BANDS,
  ageInYears,
  ageBandFor,
  consentPolicy,
  isParticipating,
  hasRequiredConsent,
  buildOptOut,
};
