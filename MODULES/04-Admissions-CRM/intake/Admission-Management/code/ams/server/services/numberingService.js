const Counter = require('../models/Counter');

/**
 * Mints the next gap-less, per-FY sequential application number.
 *
 * Uses findOneAndUpdate with $inc and upsert:true, which MongoDB executes atomically
 * on the document level - this is safe under concurrent submissions without needing
 * an explicit session/transaction, because two concurrent requests will always be
 * serialized by the storage engine for the same document (per NFR Data integrity).
 *
 * Format: APP/<FY>/<6-digit sequence> e.g. APP/2026-27/000101
 * Single-tenant assumption (see README Assumption #6) - no school-code prefix needed;
 * if multi-tenant is confirmed later, prepend `${schoolCode}/` here.
 */
const getNextApplicationNumber = async (fy) => {
  const counter = await Counter.findOneAndUpdate(
    { fy },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const padded = String(counter.seq).padStart(6, '0');
  return `APP/${fy}/${padded}`;
};

module.exports = { getNextApplicationNumber };
