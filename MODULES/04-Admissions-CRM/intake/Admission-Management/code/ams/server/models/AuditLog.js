const mongoose = require('mongoose');

// NFR Auditability: source changes, quota overrides, document rejections, rank corrections
const auditLogSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true }, // 'Application' | 'Document' | 'Quota' | 'TestResult' etc.
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    action: { type: String, required: true }, // e.g. 'SOURCE_CHANGE', 'DOC_REJECTED', 'QUOTA_OVERRIDE'
    reason: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

auditLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
