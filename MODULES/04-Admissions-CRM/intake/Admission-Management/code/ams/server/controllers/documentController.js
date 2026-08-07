const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ApplicationDocument = require('../models/ApplicationDocument');
const DocumentChecklist = require('../models/DocumentChecklist');
const Application = require('../models/Application');
const { logAudit } = require('../services/auditService');
const { DOC_CHECKLIST_DEFAULT } = require('../config/constants');

// GET /api/documents/checklist/:classApplied (FR10)
const getChecklist = asyncHandler(async (req, res) => {
  const checklist = await DocumentChecklist.findOne({ classApplied: req.params.classApplied });
  res.json(new ApiResponse(200, { requiredDocs: checklist?.requiredDocs || DOC_CHECKLIST_DEFAULT }));
});

// PUT /api/documents/checklist/:classApplied (admin configures per class/board) (FR10)
const setChecklist = asyncHandler(async (req, res) => {
  const { requiredDocs, board } = req.body;
  const checklist = await DocumentChecklist.findOneAndUpdate(
    { classApplied: req.params.classApplied, board: board || 'Any' },
    { requiredDocs },
    { upsert: true, new: true }
  );
  res.json(new ApiResponse(200, { checklist }, 'Checklist updated'));
});

// GET /api/documents/application/:applicationId
const listByApplication = asyncHandler(async (req, res) => {
  const documents = await ApplicationDocument.find({ application: req.params.applicationId });
  res.json(new ApiResponse(200, { documents }));
});

// POST /api/documents/:docId/upload (FR11 - applicant uploads, pre- or post-submit)
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const doc = await ApplicationDocument.findById(req.params.docId);
  if (!doc) throw new ApiError(404, 'Document slot not found');

  doc.fileName = req.file.originalname;
  doc.filePath = `/uploads/${req.file.filename}`;
  doc.mimeType = req.file.mimetype;
  doc.status = 'Pending';
  doc.rejectionReason = undefined;
  await doc.save();

  res.json(new ApiResponse(200, { document: doc }, 'Document uploaded'));
});

// GET /api/documents/verification-queue (staff) (FR12)
const verificationQueue = asyncHandler(async (req, res) => {
  const documents = await ApplicationDocument.find({ status: { $ne: 'Verified' }, filePath: { $exists: true } })
    .populate({ path: 'application', select: 'applicationNo student status' })
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, { documents }));
});

// PATCH /api/documents/:docId/verify (FR12/FR13)
const verifyDocument = asyncHandler(async (req, res) => {
  const { decision, reason } = req.body; // decision: 'Verified' | 'Rejected'
  const doc = await ApplicationDocument.findById(req.params.docId);
  if (!doc) throw new ApiError(404, 'Document not found');
  if (decision === 'Rejected' && !reason) throw new ApiError(400, 'Rejection reason is required');

  doc.status = decision;
  doc.rejectionReason = decision === 'Rejected' ? reason : undefined;
  doc.verifiedBy = req.user._id;
  doc.verifiedOn = new Date();
  await doc.save();

  if (decision === 'Rejected') {
    await logAudit({
      entityType: 'Document',
      entityId: doc._id,
      action: 'DOC_REJECTED',
      reason,
      performedBy: req.user._id,
    });
    // Rejection reopens upload for applicant (FR12) - clearing filePath signals "needs re-upload"
    doc.filePath = undefined;
    doc.status = 'Pending';
    await doc.save();
  }

  // FR13: gate progression - if all required docs Verified, mark application Documents Verified
  const allDocs = await ApplicationDocument.find({ application: doc.application });
  const allVerified = allDocs.length > 0 && allDocs.every((d) => d.status === 'Verified');
  if (allVerified) {
    await Application.findByIdAndUpdate(doc.application, { status: 'Documents Verified' });
  } else if (decision === 'Verified') {
    await Application.findByIdAndUpdate(doc.application, { status: 'Documents Pending' });
  }

  res.json(new ApiResponse(200, { document: doc }, `Document ${decision.toLowerCase()}`));
});

module.exports = { getChecklist, setChecklist, listByApplication, uploadDocument, verificationQueue, verifyDocument };
