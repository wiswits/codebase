const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Application = require('../models/Application');
const Enquiry = require('../models/Enquiry');
const DocumentChecklist = require('../models/DocumentChecklist');
const ApplicationDocument = require('../models/ApplicationDocument');
const { getNextApplicationNumber } = require('../services/numberingService');
const { generateToken } = require('../services/tokenService');
const { sendEmail, sendSms } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');
const { DOC_CHECKLIST_DEFAULT } = require('../config/constants');

/* -------------------- PUBLIC (no login) -------------------- */

// POST /api/public/applications/start (FR1/FR2) - creates a Draft, returns resumable token
const startApplication = asyncHandler(async (req, res) => {
  const { classAppliedFor } = req.body;
  if (!classAppliedFor) throw new ApiError(400, 'classAppliedFor is required');

  const draftToken = generateToken();
  const application = await Application.create({
    fy: process.env.CURRENT_FY,
    draftToken,
    isDraft: true,
    student: { classAppliedFor },
  });

  res.status(201).json(new ApiResponse(201, { draftToken, applicationId: application._id }, 'Draft started'));
});

// GET /api/public/applications/:draftToken - resume a draft (FR2)
const getDraft = asyncHandler(async (req, res) => {
  const application = await Application.findOne({ draftToken: req.params.draftToken });
  if (!application) throw new ApiError(404, 'Draft not found or link expired');
  if (!application.isDraft) throw new ApiError(400, 'This application has already been submitted');
  res.json(new ApiResponse(200, { application }));
});

// PATCH /api/public/applications/:draftToken - auto-save on every step (FR2)
const saveDraftStep = asyncHandler(async (req, res) => {
  const application = await Application.findOne({ draftToken: req.params.draftToken });
  if (!application) throw new ApiError(404, 'Draft not found or link expired');
  if (!application.isDraft) throw new ApiError(400, 'This application has already been submitted');

  const { student, parent, academic, currentStep, source, sourceDetail, quotaCategory, quotaEligibility } = req.body;
  if (student) Object.assign(application.student, student);
  if (parent) Object.assign(application.parent, parent);
  if (academic) Object.assign(application.academic, academic);
  if (source && !application.sourceLocked) {
    application.source = source;
    application.sourceDetail = sourceDetail;
  }
  if (quotaCategory) application.quotaCategory = quotaCategory;
  if (quotaEligibility) Object.assign(application.quotaEligibility, quotaEligibility);
  if (currentStep) application.currentStep = currentStep;

  await application.save();
  res.json(new ApiResponse(200, { application }, 'Draft saved'));
});

// POST /api/public/applications/:draftToken/submit - final submit, mints number (FR3, FR29)
const submitApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({ draftToken: req.params.draftToken });
  if (!application) throw new ApiError(404, 'Draft not found or link expired');
  if (!application.isDraft) throw new ApiError(400, 'This application has already been submitted');

  if (!application.student?.name || !application.parent?.phone) {
    throw new ApiError(400, 'Student name and parent phone are required before submitting');
  }

  // Number minted only here, transactionally, never on draft creation (FR3/FR29)
  const applicationNo = await getNextApplicationNumber(application.fy);
  application.applicationNo = applicationNo;
  application.isDraft = false;
  application.status = 'Submitted';
  application.sourceLocked = true; // FR9 - locked once captured at application stage
  application.submittedAt = new Date();
  await application.save();

  // Seed the document checklist rows for this application (FR10/FR11)
  const checklist = await DocumentChecklist.findOne({ classApplied: application.student.classAppliedFor });
  const requiredDocs = checklist?.requiredDocs || DOC_CHECKLIST_DEFAULT;
  await Promise.all(
    requiredDocs.map((docType) =>
      ApplicationDocument.findOneAndUpdate(
        { application: application._id, docType },
        { application: application._id, docType },
        { upsert: true }
      )
    )
  );

  // Convert linked enquiry to "Converted" if one exists, else leave standalone
  if (application.enquiry) {
    await Enquiry.findByIdAndUpdate(application.enquiry, { stage: 'Converted', application: application._id });
  }

  if (application.parent?.email) {
    await sendEmail({
      to: application.parent.email,
      subject: `Application Received - ${applicationNo}`,
      html: `<p>Your application <b>${applicationNo}</b> for ${application.student.name} has been received.</p>`,
    });
  }
  if (application.parent?.phone) {
    await sendSms({ to: application.parent.phone, message: `Application ${applicationNo} submitted successfully.` });
  }

  res.json(new ApiResponse(200, { application }, 'Application submitted successfully'));
});

/* -------------------- STAFF (authenticated) -------------------- */

// GET /api/applications
const listApplications = asyncHandler(async (req, res) => {
  const { status, classApplied, source, search, page = 1, limit = 20, fy } = req.query;
  const filter = { isDraft: false };
  if (status) filter.status = status;
  if (classApplied) filter['student.classAppliedFor'] = classApplied;
  if (source) filter.source = source;
  if (fy) filter.fy = fy;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [applications, total] = await Promise.all([
    Application.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Application.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { applications, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

// GET /api/applications/:id
const getApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('testResult')
    .populate('interview')
    .populate('offer');
  if (!application) throw new ApiError(404, 'Application not found');

  const documents = await ApplicationDocument.find({ application: application._id });
  res.json(new ApiResponse(200, { application, documents }));
});

// PATCH /api/applications/:id/status
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, 'Application not found');

  application.status = status;
  application.auditLog.push({ action: `STATUS_CHANGE:${status}`, by: req.user._id });
  await application.save();
  res.json(new ApiResponse(200, { application }, 'Status updated'));
});

// PATCH /api/applications/:id/source (FR9 - staff-side change with audit)
const changeApplicationSource = asyncHandler(async (req, res) => {
  const { source, sourceDetail, reason } = req.body;
  if (!reason) throw new ApiError(400, 'A reason is required to change a locked source');

  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, 'Application not found');

  const from = application.source;
  application.source = source;
  application.sourceDetail = sourceDetail;
  application.sourceChangeLog.push({ action: 'SOURCE_CHANGE', reason, by: req.user._id, meta: { from, to: source } });
  await application.save();

  await logAudit({
    entityType: 'Application',
    entityId: application._id,
    action: 'SOURCE_CHANGE',
    reason,
    performedBy: req.user._id,
    meta: { from, to: source },
  });

  res.json(new ApiResponse(200, { application }, 'Source updated and logged'));
});

module.exports = {
  startApplication,
  getDraft,
  saveDraftStep,
  submitApplication,
  listApplications,
  getApplication,
  updateStatus,
  changeApplicationSource,
};
