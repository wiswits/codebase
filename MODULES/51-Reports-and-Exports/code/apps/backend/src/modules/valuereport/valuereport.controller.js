'use strict';
/**
 * Value report controller — read-only, one endpoint.
 */
const { success, error } = require('../../utils/response');
const logger = require('../../utils/logger');
const { getActiveSchool } = require('../../utils/activeSchool');
const service = require('./valuereport.service');

/**
 * GET /api/value-report
 *
 * The active branch is resolved server-side by the shared resolver, never taken
 * from the caller: a branch-locked admin sending x-active-school for another
 * branch must not be able to read that branch's numbers out of this endpoint.
 */
exports.getValueReport = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const schoolId = await getActiveSchool(req);
    const report = await service.getValueReport(orgId, schoolId);
    return success(res, report, 'Value report');
  } catch (e) {
    // The billing page treats this section as optional and renders without it,
    // so a failure here must be loud in the log and quiet on the customer's
    // screen — never a 500 that hides the plan and the invoices behind it.
    logger.error('value report failed:', e.message);
    return error(res, 'Could not build your value report', 500);
  }
};
