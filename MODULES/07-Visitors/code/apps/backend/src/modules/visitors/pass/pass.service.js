'use strict';
const crypto = require('crypto');
const { transaction } = require('../../../config/db');
const { AppError } = require('../_kit');
const visitorQueries = require('../core/visitor.queries');
const passQueries = require('./pass.queries');

// One retry per collision, three attempts total. 32 bits of randomness against a
// UNIQUE(org_id, pass_code) constraint will collide eventually, and upstream had
// no retry at all — the duplicate surfaced to the front desk as a bare
// "Internal server error" with nothing to act on.
const MAX_CODE_ATTEMPTS = 3;

/**
 * VIS-YYYYMMDD-XXXXXXXX, e.g. VIS-20260731-A3F19C22.
 *
 * The date part is IST, not UTC. Upstream took it from toISOString(), so every
 * pass issued after 5:30am IST carried the previous day's date — a gate pass the
 * guard would read as stale on the very day it was printed.
 */
function generatePassCode(now = new Date()) {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const stamp = ist.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `VIS-${stamp}-${rand}`;
}

/**
 * Issue a gate pass for a checked-in visitor.
 *
 * Idempotent by design: a visit that already holds a valid pass gets that same
 * pass back rather than a second one, so a double-tap at the front desk cannot
 * put two live passes on one visitor.
 */
async function issuePass({ orgId, visitorId, expiresAt, userId, schoolId = null }) {
  return transaction(async (conn) => {
    const visitor = await visitorQueries.findVisitorByIdForUpdate(orgId, visitorId, conn, schoolId);
    if (!visitor) throw new AppError(404, 'VISITOR_NOT_FOUND', 'Visitor not found.');
    if (visitor.status !== 'checked_in') {
      throw new AppError(
        409,
        'VISITOR_NOT_CHECKED_IN',
        'A gate pass can only be issued to a checked-in visitor.'
      );
    }

    const existing = await passQueries.findActivePassByVisitorId(orgId, visitorId, conn);
    if (existing) return { pass: existing, created: false };

    for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt += 1) {
      const passCode = generatePassCode();
      try {
        const passId = await passQueries.insertPass(
          { orgId, visitorId, passCode, expiresAt, userId },
          conn
        );
        const pass = await passQueries.findPassById(orgId, passId, conn);
        return { pass, created: true };
      } catch (err) {
        const isDuplicateCode = err && err.code === 'ER_DUP_ENTRY';
        if (!isDuplicateCode || attempt === MAX_CODE_ATTEMPTS) throw err;
        // else: astronomically unlikely code clash — draw another and retry.
      }
    }

    // Unreachable: the loop either returns or throws.
    throw new AppError(500, 'PASS_CODE_EXHAUSTED', 'Could not issue a gate pass.');
  });
}

async function getPass(orgId, visitorId, schoolId = null) {
  // The pass is reachable only through a visit this caller may read, so the
  // branch check belongs on the visit, not on the pass row.
  const visitor = await visitorQueries.findVisitorById(orgId, visitorId, undefined, schoolId);
  if (!visitor) throw new AppError(404, 'VISITOR_NOT_FOUND', 'Visitor not found.');
  return passQueries.findLatestPassByVisitorId(orgId, visitorId);
}

module.exports = { issuePass, getPass, generatePassCode };
