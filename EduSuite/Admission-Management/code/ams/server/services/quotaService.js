const Quota = require('../models/Quota');
const Application = require('../models/Application');

/**
 * Seat-lock timing assumption (Open Question #5): seats are locked/decremented on
 * OFFER-ACCEPT (not merely on admitted), since PRD FR24 says accept "triggers admission
 * flow" and reject/expiry "releases seat back to quota pool" - implying the seat was
 * held from acceptance onward. Documented in README Assumption #5.
 */

const allocateSeat = async ({ classApplied, fy, category }) => {
  const quota = await Quota.findOneAndUpdate(
    { classApplied, fy, category },
    { $inc: { filled: 1 } },
    { new: true }
  );
  return quota;
};

const releaseSeat = async ({ classApplied, fy, category }) => {
  const quota = await Quota.findOne({ classApplied, fy, category });
  if (!quota) return null;
  quota.filled = Math.max(0, quota.filled - 1);
  await quota.save();
  return promoteNextWaitlisted({ classApplied, fy, category });
};

// FR27: auto-promote next rank on seat release
const promoteNextWaitlisted = async ({ classApplied, fy, category }) => {
  const quota = await Quota.findOne({ classApplied, fy, category });
  if (!quota || !quota.waitlist.length) return null;

  quota.waitlist.sort((a, b) => a.rank - b.rank);
  const next = quota.waitlist.shift();
  await quota.save();

  if (next) {
    await Application.findByIdAndUpdate(next.application, { status: 'Offer Sent' });
  }
  return next;
};

const hasAvailableSeat = async ({ classApplied, fy, category }) => {
  const quota = await Quota.findOne({ classApplied, fy, category });
  if (!quota) return false;
  return quota.filled < quota.totalSeats;
};

const addToWaitlist = async ({ classApplied, fy, category, applicationId }) => {
  const quota = await Quota.findOne({ classApplied, fy, category });
  if (!quota) return null;
  const rank = quota.waitlist.length + 1;
  quota.waitlist.push({ application: applicationId, rank });
  await quota.save();
  return rank;
};

module.exports = { allocateSeat, releaseSeat, promoteNextWaitlisted, hasAvailableSeat, addToWaitlist };
