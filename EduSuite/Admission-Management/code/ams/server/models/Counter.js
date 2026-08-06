const mongoose = require('mongoose');

/**
 * One document per Financial Year (per NFR "Data integrity"). Application numbers
 * are minted transactionally via $inc (atomic at the MongoDB document level),
 * which is safe under concurrent submissions without needing a separate lock -
 * MongoDB's findOneAndUpdate with $inc is atomic per document.
 *
 * Numbers are never reused (FR30) because we only ever increment, never decrement,
 * even if an application is later rejected/withdrawn.
 */
const counterSchema = new mongoose.Schema({
  fy: { type: String, required: true, unique: true }, // e.g. "2026-27"
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
