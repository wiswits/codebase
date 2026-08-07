'use strict';
const { success } = require('../../../utils/response');
const { audit } = require('../../../utils/audit');
const { asyncHandler } = require('../_kit');
const { getActiveSchool } = require('../../../utils/activeSchool');
const alumniService = require('./alumni.service');

// The branch is resolved HERE, in the controller, because getActiveSchool needs
// the request: the caller's memberships and the branch-switcher header. Below
// this line it is just a number threaded down, and null means "not scoped".
const getAllAlumni = asyncHandler(async (req, res) => {
  const { search, graduationYear, stream, page, limit } = req.query;
  const result = await alumniService.listAlumni({
    orgId: req.user.org_id,
    search,
    graduationYear,
    stream,
    page,
    limit,
    schoolId: await getActiveSchool(req),
  });
  return success(res, result, 'Alumni fetched');
});

const getAlumnusById = asyncHandler(async (req, res) => {
  const alumnus = await alumniService.getAlumnus(
    req.user.org_id,
    req.params.alumniId,
    await getActiveSchool(req)
  );
  return success(res, { alumnus }, 'Alumni record fetched');
});

const updateAlumnus = asyncHandler(async (req, res) => {
  const alumnus = await alumniService.updateAlumnus(
    req.user.org_id,
    req.params.alumniId,
    req.body,
    await getActiveSchool(req)
  );
  await audit(req, 'ALUMNI_UPDATE', 'alumni_profile', alumnus.id, { new_data: req.body });
  return success(res, { alumnus }, 'Alumni record updated');
});

module.exports = { getAllAlumni, getAlumnusById, updateAlumnus };
