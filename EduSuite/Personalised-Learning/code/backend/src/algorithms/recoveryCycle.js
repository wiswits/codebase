'use strict';

/**
 * ALGORITHM 6 — RECOVERY CYCLE (decision core) ⭐⭐⭐
 *
 * This is the PROOF of the WISWITS Loop. Iske bina "hum madad karte hain".
 * Iske saath "892 gaps band kiye, +23% average".
 *
 * Pure decisions here; persistence, worksheet generation, alerts, and
 * recheck-dependents live in the service.
 */

const { C } = require('./constants');

/**
 * Classify a retest outcome.
 *   before: detected accuracy, after: retest accuracy.
 */
function classifyOutcome(before, after) {
  const delta = after - before;
  let outcome;
  if (after >= C.CLOSE_THRESHOLD) outcome = 'closed';
  else if (delta >= C.IMPROVE_THRESHOLD) outcome = 'improved';
  else if (delta > C.WORSEN_THRESHOLD) outcome = 'no_change';
  else outcome = 'worsened';
  return { outcome, delta };
}

/**
 * Given the current outcome, what should the loop do next?
 * Returns a directive the service executes.
 */
function nextAction(outcome) {
  switch (outcome) {
    case 'closed':
      return { action: 'close_weak_area', recheck_dependents: true, escalate: false };
    case 'improved':
      return { action: 'start_cycle', strategy: 'mixed', escalate: false };
    case 'no_change':
      return { action: 'start_cycle', strategy: 'confidence_build', escalate: false };
    case 'worsened':
      return { action: 'escalate', escalate: true, reason: 'worsened' };
    default:
      return { action: 'none' };
  }
}

/**
 * Should a new cycle be allowed to start?
 *   currentCycleCount = number of cycles already run for this weak area.
 * Returns { allowed, cycleNo, needsTeacher }.
 */
function canStartCycle(currentCycleCount) {
  const cycleNo = currentCycleCount + 1;
  if (cycleNo > C.MAX_CYCLES) {
    return { allowed: false, cycleNo, needsTeacher: true };
  }
  return { allowed: true, cycleNo, needsTeacher: false };
}

module.exports = { classifyOutcome, nextAction, canStartCycle };
