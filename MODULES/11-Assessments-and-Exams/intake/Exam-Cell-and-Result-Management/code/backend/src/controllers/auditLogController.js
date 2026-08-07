import asyncHandler from 'express-async-handler';
import AuditLog from '../models/AuditLog.js';

// @desc    Get audit logs (filter by module/user, paginated)
// @route   GET /api/audit-logs
// @access  Private (Admin, Principal)
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { module, user, page = 1, limit = 20 } = req.query;
  const query = {};
  if (module) query.module = module;
  if (user) query.user = user;

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AuditLog.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit) },
  });
});
