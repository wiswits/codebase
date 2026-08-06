module.exports = function getOrgId(req) {
    return Number(req.query.org_id || req.body.org_id) || 1;
};