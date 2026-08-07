const AuditLog = require('../models/AuditLog');

const logAudit = async ({ entityType, entityId, action, reason, performedBy, meta }) => {
  return AuditLog.create({ entityType, entityId, action, reason, performedBy, meta });
};

module.exports = { logAudit };
