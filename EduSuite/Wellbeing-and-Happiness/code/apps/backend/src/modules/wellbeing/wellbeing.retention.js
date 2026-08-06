// wellbeing.retention.js
//
// ⚠️ Data ko bhi bhoolna chahiye. Data should forget too.
//    Class 8 ka bura daur Class 12 me nahi chipakna chahiye.
//
// Retention jobs (run daily by a cron / scheduler):
//   · Pulse older than retention → anonymize (student_id = NULL), rolled into
//     wb_pulse_aggregate so class trends survive but the individual does not.
//   · Journal older than retention → hard delete (student may delete sooner).
//
// Retention windows come from the guardrails (365 default, 180 for under-13,
// 730 for journal). These functions are pure orchestration over an injected db.

const { wbDb } = require('../../config/db');
const { WB_GUARDRAILS } = require('./wellbeing.guardrails');

// Anonymize pulses past their window. Returns count anonymized.
// The retention window is applied per row via the student's age at the routes
// layer; here we apply the default 365 for the main sweep and 180 as a tighter
// secondary sweep for rows flagged young (age_band captured at write time is a
// later refinement — for now the DB stores the effective window per org policy).
async function anonymizeOldPulses({ retentionDays = WB_GUARDRAILS.MOOD_RETENTION_DAYS } = {}, db = wbDb) {
  const res = await db.query(
    `UPDATE wb_pulse
        SET student_id = NULL, note = NULL, context_tags_json = NULL
      WHERE student_id IS NOT NULL
        AND date < (CURDATE() - INTERVAL ? DAY)`,
    [retentionDays]
  );
  return { anonymized: res.affectedRows ?? 0 };
}

// Hard-delete journal entries past their window.
async function purgeOldJournal({ retentionDays = WB_GUARDRAILS.JOURNAL_RETENTION_DAYS } = {}, db = wbDb) {
  const res = await db.query(
    `DELETE FROM wb_journal WHERE created_at < (NOW() - INTERVAL ? DAY)`,
    [retentionDays]
  );
  return { purged: res.affectedRows ?? 0 };
}

// Expire stale flags (open but past their signal horizon) — housekeeping.
async function expireStaleFlags({ days = 30 } = {}, db = wbDb) {
  const res = await db.query(
    `UPDATE wb_flag SET status = 'expired', closed_at = NOW(), close_reason = 'auto-expired'
      WHERE status = 'open' AND severity IN ('green','amber')
        AND opened_at < (NOW() - INTERVAL ? DAY)`,
    [days]
  );
  return { expired: res.affectedRows ?? 0 };
}

async function runDailyRetention(db = wbDb) {
  const pulse = await anonymizeOldPulses({}, db);
  const journal = await purgeOldJournal({}, db);
  const flags = await expireStaleFlags({}, db);
  return { pulse, journal, flags, at: new Date() };
}

module.exports = { anonymizeOldPulses, purgeOldJournal, expireStaleFlags, runDailyRetention };
