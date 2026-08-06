const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Offer = require('../models/Offer');
const Application = require('../models/Application');
const { generateToken } = require('../services/tokenService');
const { generateOfferLetterPdf } = require('../services/pdfService');
const { sendEmail, sendSms } = require('../services/notificationService');
const { hasAvailableSeat, allocateSeat, releaseSeat, addToWaitlist } = require('../services/quotaService');

// POST /api/offers/:applicationId/generate (FR22)
const generateOffer = asyncHandler(async (req, res) => {
  const { tokenAmount = 10000, validDays = 10 } = req.body;
  const application = await Application.findById(req.params.applicationId);
  if (!application) throw new ApiError(404, 'Application not found');

  const validTill = new Date();
  validTill.setDate(validTill.getDate() + Number(validDays));

  const offer = await Offer.create({
    application: application._id,
    token: generateToken(), // FR23 - unique, single-use token
    tokenAmount,
    validTill,
  });

  const { fileName, filePath } = await generateOfferLetterPdf({ application, offer });
  offer.pdfPath = `/uploads/${fileName}`;
  await offer.save();

  application.offer = offer._id;
  application.status = 'Offer Sent';
  await application.save();

  if (application.parent?.email) {
    await sendEmail({
      to: application.parent.email,
      subject: `Offer of Admission - ${application.applicationNo}`,
      html: `<p>Congratulations! View and accept your offer here: ${process.env.CLIENT_URL}/offer/${offer.token}</p>`,
    });
  }

  res.status(201).json(new ApiResponse(201, { offer }, 'Offer generated'));
});

// GET /api/offers - list all offers for staff view
const listOffers = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [offers, total] = await Promise.all([
    Offer.find(filter)
      .populate({ path: 'application', select: 'applicationNo student status quotaCategory' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Offer.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { offers, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

// GET /api/offers/application/:applicationId
const getOfferByApplication = asyncHandler(async (req, res) => {
  const offer = await Offer.findOne({ application: req.params.applicationId });
  if (!offer) throw new ApiError(404, 'No offer found for this application');
  res.json(new ApiResponse(200, { offer }));
});

/* -------------------- PUBLIC token-based accept/reject (FR23/FR24) -------------------- */

// GET /api/public/offers/:token
const getOfferByToken = asyncHandler(async (req, res) => {
  const offer = await Offer.findOne({ token: req.params.token }).populate('application');
  if (!offer) throw new ApiError(404, 'Offer link not found');
  if (new Date() > offer.validTill && offer.status === 'Pending') {
    offer.status = 'Expired';
    await offer.save();
  }
  res.json(new ApiResponse(200, { offer }));
});

// POST /api/public/offers/:token/decision  { decision: 'Accepted' | 'Rejected' }
const decideOffer = asyncHandler(async (req, res) => {
  const { decision } = req.body;
  const offer = await Offer.findOne({ token: req.params.token }).populate('application');
  if (!offer) throw new ApiError(404, 'Offer link not found');
  if (offer.tokenUsed) throw new ApiError(400, 'This offer link has already been used');
  if (new Date() > offer.validTill) throw new ApiError(400, 'This offer link has expired');

  const application = offer.application;

  if (decision === 'Accepted') {
    const available = await hasAvailableSeat({
      classApplied: application.student.classAppliedFor,
      fy: application.fy,
      category: application.quotaCategory,
    });

    if (available) {
      await allocateSeat({
        classApplied: application.student.classAppliedFor,
        fy: application.fy,
        category: application.quotaCategory,
      });
      application.status = 'Admitted'; // FR24 - triggers admission flow
    } else {
      // No seat left despite offer (edge case) - waitlist instead
      await addToWaitlist({
        classApplied: application.student.classAppliedFor,
        fy: application.fy,
        category: application.quotaCategory,
        applicationId: application._id,
      });
      application.status = 'Waitlisted';
    }
    offer.status = 'Accepted';
  } else if (decision === 'Rejected') {
    offer.status = 'Rejected';
    application.status = 'Rejected';
    // Release seat back to quota pool (FR24) - only if one had been allocated
    await releaseSeat({
      classApplied: application.student.classAppliedFor,
      fy: application.fy,
      category: application.quotaCategory,
    });
  } else {
    throw new ApiError(400, "decision must be 'Accepted' or 'Rejected'");
  }

  offer.tokenUsed = true;
  offer.decidedAt = new Date();
  offer.acceptanceHistory.push({ action: decision, ip: req.ip });
  await offer.save();
  await application.save();

  res.json(new ApiResponse(200, { offer, application }, `Offer ${decision.toLowerCase()}`));
});

module.exports = { generateOffer, listOffers, getOfferByApplication, getOfferByToken, decideOffer };
