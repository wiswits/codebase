const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Quota = require('../models/Quota');
const { logAudit } = require('../services/auditService');

// GET /api/quotas?classApplied=&fy=
const listQuotas = asyncHandler(async (req, res) => {
  const { classApplied, fy = process.env.CURRENT_FY } = req.query;
  const filter = { fy };
  if (classApplied) filter.classApplied = classApplied;
  const quotas = await Quota.find(filter).populate('waitlist.application', 'applicationNo student.name');
  res.json(new ApiResponse(200, { quotas }));
});

// POST /api/quotas (FR25 - define seat pools per class per FY per category)
const upsertQuota = asyncHandler(async (req, res) => {
  const { classApplied, category, totalSeats, statutoryPercent, eligibilityRule, fy = process.env.CURRENT_FY, reason } = req.body;
  if (!classApplied || !category) throw new ApiError(400, 'classApplied and category are required');

  const existing = await Quota.findOne({ classApplied, fy, category });
  const quota = await Quota.findOneAndUpdate(
    { classApplied, fy, category },
    { totalSeats, statutoryPercent, eligibilityRule },
    { upsert: true, new: true }
  );

  if (existing && existing.totalSeats !== totalSeats) {
    await logAudit({
      entityType: 'Quota',
      entityId: quota._id,
      action: 'QUOTA_OVERRIDE',
      reason: reason || 'Seat count updated by admin',
      performedBy: req.user._id,
      meta: { from: existing.totalSeats, to: totalSeats },
    });
  }

  res.json(new ApiResponse(200, { quota }, 'Quota configured'));
});

// GET /api/quotas/dashboard (FR28 - real-time seat-fill vs statutory)
const dashboard = asyncHandler(async (req, res) => {
  const { fy = process.env.CURRENT_FY, classApplied } = req.query;
  const filter = { fy };
  if (classApplied) filter.classApplied = classApplied;
  const quotas = await Quota.find(filter);

  const summary = quotas.map((q) => ({
    classApplied: q.classApplied,
    category: q.category,
    totalSeats: q.totalSeats,
    filled: q.filled,
    available: Math.max(0, q.totalSeats - q.filled),
    percentFilled: q.totalSeats ? Math.round((q.filled / q.totalSeats) * 1000) / 10 : 0,
    statutoryPercent: q.statutoryPercent,
    waitlistCount: q.waitlist.length,
  }));

  res.json(new ApiResponse(200, { summary }));
});

module.exports = { listQuotas, upsertQuota, dashboard };
