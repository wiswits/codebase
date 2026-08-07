const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Enquiry = require('../models/Enquiry');
const { logAudit } = require('../services/auditService');

// GET /api/enquiries?stage=&source=&counselor=&search=&page=&limit=
const listEnquiries = asyncHandler(async (req, res) => {
  const { stage, source, counselor, search, page = 1, limit = 50, fy } = req.query;
  const filter = {};
  if (stage) filter.stage = stage;
  if (source) filter.source = source;
  if (counselor) filter.counselor = counselor;
  if (fy) filter.fy = fy;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [enquiries, total] = await Promise.all([
    Enquiry.find(filter).populate('counselor', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Enquiry.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { enquiries, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

// GET /api/enquiries/board - grouped by stage for Kanban (FR5)
const kanbanBoard = asyncHandler(async (req, res) => {
  const { fy, source, counselor, search } = req.query;
  const filter = {};
  if (fy) filter.fy = fy;
  if (source) filter.source = source;
  if (counselor) filter.counselor = counselor;
  if (search) filter.$text = { $search: search };

  const enquiries = await Enquiry.find(filter).populate('counselor', 'name').sort({ createdAt: -1 });
  const { ENQUIRY_STAGES } = require('../config/constants');
  const board = {};
  ENQUIRY_STAGES.forEach((s) => (board[s] = []));
  enquiries.forEach((e) => board[e.stage]?.push(e));

  res.json(new ApiResponse(200, { board }));
});

// POST /api/enquiries (FR4 - manual walk-in/phone log)
const createEnquiry = asyncHandler(async (req, res) => {
  const { studentName, parentName, phone, email, classAppliedFor, source, sourceDetail, counselor } = req.body;
  if (!studentName || !phone || !classAppliedFor || !source) {
    throw new ApiError(400, 'studentName, phone, classAppliedFor and source are required');
  }

  const enquiry = await Enquiry.create({
    studentName,
    parentName,
    phone,
    email,
    classAppliedFor,
    source,
    sourceDetail,
    counselor,
    fy: process.env.CURRENT_FY,
  });

  res.status(201).json(new ApiResponse(201, { enquiry }, 'Enquiry logged'));
});

// PATCH /api/enquiries/:id/stage (FR5/FR6 - drag-to-change, mandatory reason for Lost)
const updateStage = asyncHandler(async (req, res) => {
  const { stage, lostReason } = req.body;
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) throw new ApiError(404, 'Enquiry not found');

  if (stage === 'Lost' && !lostReason) {
    throw new ApiError(400, 'A reason is required when marking an enquiry as Lost');
  }

  enquiry.stage = stage;
  if (stage === 'Lost') enquiry.lostReason = lostReason;
  await enquiry.save();

  res.json(new ApiResponse(200, { enquiry }, 'Stage updated'));
});

// POST /api/enquiries/:id/contact-log (FR7)
const addContactLog = asyncHandler(async (req, res) => {
  const { note } = req.body;
  if (!note) throw new ApiError(400, 'note is required');

  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) throw new ApiError(404, 'Enquiry not found');

  enquiry.contactLog.push({ note, by: req.user._id });
  await enquiry.save();
  res.json(new ApiResponse(200, { enquiry }, 'Contact logged'));
});

// PATCH /api/enquiries/:id/assign (FR7)
const assignCounselor = asyncHandler(async (req, res) => {
  const { counselor } = req.body;
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { counselor }, { new: true });
  if (!enquiry) throw new ApiError(404, 'Enquiry not found');
  res.json(new ApiResponse(200, { enquiry }, 'Counselor assigned'));
});

// PATCH /api/enquiries/:id/source (FR9 - locked post-capture, requires logged reason to change)
const changeSource = asyncHandler(async (req, res) => {
  const { source, sourceDetail, reason } = req.body;
  if (!reason) throw new ApiError(400, 'A reason is required to change a locked source');

  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) throw new ApiError(404, 'Enquiry not found');

  const oldSource = enquiry.source;
  enquiry.source = source;
  enquiry.sourceDetail = sourceDetail;
  await enquiry.save();

  await logAudit({
    entityType: 'Enquiry',
    entityId: enquiry._id,
    action: 'SOURCE_CHANGE',
    reason,
    performedBy: req.user._id,
    meta: { from: oldSource, to: source },
  });

  res.json(new ApiResponse(200, { enquiry }, 'Source updated and logged'));
});

module.exports = {
  listEnquiries,
  kanbanBoard,
  createEnquiry,
  updateStage,
  addContactLog,
  assignCounselor,
  changeSource,
};
