'use strict';
const { success } = require('../../../utils/response');
const { audit } = require('../../../utils/audit');
const { asyncHandler } = require('../_kit');
const { getActiveSchool } = require('../../../utils/activeSchool');
const passService = require('./pass.service');

const issuePass = asyncHandler(async (req, res) => {
  const { pass, created } = await passService.issuePass({
    orgId: req.user.org_id,
    visitorId: req.params.visitorId,
    expiresAt: req.body.expiresAt || null,
    userId: req.user.user_id,
    schoolId: await getActiveSchool(req),
  });

  // Re-issuing to a visit that already holds a valid pass returns that same pass
  // rather than minting a second one, so only a real issue is audited.
  if (created) {
    await audit(req, 'VISITOR_PASS_ISSUE', 'visitor_pass', pass.id, {
      new_data: { visitorId: Number(req.params.visitorId), expiresAt: pass.expiresAt },
    });
  }

  return success(res, { pass }, created ? 'Gate pass issued' : 'Gate pass already issued', created ? 201 : 200);
});

const getPass = asyncHandler(async (req, res) => {
  const pass = await passService.getPass(req.user.org_id, req.params.visitorId, await getActiveSchool(req));
  return success(res, { pass }, 'Gate pass fetched');
});

module.exports = { issuePass, getPass };
