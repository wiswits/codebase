const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const InterviewSlot = require('../models/InterviewSlot');
const Interview = require('../models/Interview');
const Application = require('../models/Application');

/**
 * POST /api/interviews/slots/generate (FR18)
 * body: { classApplied, startDate, endDate, durationMinutes, panels: [{label, panelistIds, capacityPerSlot}], dailyStart, dailyEnd }
 * Generates slots for each panel across the date range at the given duration.
 */
const generateSlots = asyncHandler(async (req, res) => {
  const { classApplied, startDate, endDate, durationMinutes = 30, panels, dailyStart = '09:00', dailyEnd = '17:00' } = req.body;
  if (!classApplied || !startDate || !endDate || !panels?.length) {
    throw new ApiError(400, 'classApplied, startDate, endDate and at least one panel are required');
  }

  const slots = [];
  const [dsH, dsM] = dailyStart.split(':').map(Number);
  const [deH, deM] = dailyEnd.split(':').map(Number);

  let cursor = new Date(startDate);
  const end = new Date(endDate);

  while (cursor <= end) {
    for (const panel of panels) {
      let slotStart = new Date(cursor);
      slotStart.setHours(dsH, dsM, 0, 0);
      const dayEnd = new Date(cursor);
      dayEnd.setHours(deH, deM, 0, 0);

      while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
        if (slotEnd > dayEnd) break;
        slots.push({
          classApplied,
          date: new Date(cursor),
          startTime: slotStart.toTimeString().slice(0, 5),
          endTime: slotEnd.toTimeString().slice(0, 5),
          panel: panel.panelistIds,
          panelLabel: panel.label,
          capacity: panel.capacityPerSlot || 1,
          fy: process.env.CURRENT_FY,
        });
        slotStart = slotEnd;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const created = await InterviewSlot.insertMany(slots);
  res.status(201).json(new ApiResponse(201, { count: created.length, slots: created }, 'Slots generated'));
});

// POST /api/interviews/slots (manual single-slot creation)
const createSlotManually = asyncHandler(async (req, res) => {
  const slot = await InterviewSlot.create({ ...req.body, fy: process.env.CURRENT_FY });
  res.status(201).json(new ApiResponse(201, { slot }, 'Slot created'));
});

// GET /api/interviews/slots?classApplied=&from=&to=
const listSlots = asyncHandler(async (req, res) => {
  const { classApplied, from, to } = req.query;
  const filter = { fy: process.env.CURRENT_FY };
  if (classApplied) filter.classApplied = classApplied;
  if (from || to) filter.date = {};
  if (from) filter.date.$gte = new Date(from);
  if (to) filter.date.$lte = new Date(to);

  const slots = await InterviewSlot.find(filter).populate('panel', 'name').sort({ date: 1, startTime: 1 });
  res.json(new ApiResponse(200, { slots }));
});

// POST /api/interviews/book (FR19 - applicant self-select or admin-assign)
const bookSlot = asyncHandler(async (req, res) => {
  const { applicationId, slotId, rubric } = req.body;
  const slot = await InterviewSlot.findById(slotId);
  if (!slot) throw new ApiError(404, 'Slot not found');
  if (slot.booked >= slot.capacity) throw new ApiError(409, 'This slot is already full');

  const application = await Application.findById(applicationId);
  if (!application) throw new ApiError(404, 'Application not found');

  const interview = await Interview.create({
    application: applicationId,
    slot: slotId,
    rubric: rubric || ['Communication', 'Subject Knowledge', 'Confidence', 'Behavior', 'Overall Impression'],
  });

  slot.booked += 1;
  await slot.save();

  application.interview = interview._id;
  application.status = 'Interview Scheduled';
  await application.save();

  res.status(201).json(new ApiResponse(201, { interview }, 'Interview booked'));
});

// GET /api/interviews/:id
const getInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id)
    .populate('slot')
    .populate('panelScores.panelist', 'name')
    .populate({ path: 'application', select: 'applicationNo student' });
  if (!interview) throw new ApiError(404, 'Interview not found');
  res.json(new ApiResponse(200, { interview }));
});

// GET /api/interviews?date= - calendar view
const listInterviews = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const slotFilter = { fy: process.env.CURRENT_FY };
  if (from || to) slotFilter.date = {};
  if (from) slotFilter.date.$gte = new Date(from);
  if (to) slotFilter.date.$lte = new Date(to);

  const slots = await InterviewSlot.find(slotFilter);
  const slotIds = slots.map((s) => s._id);
  const interviews = await Interview.find({ slot: { $in: slotIds } })
    .populate('slot')
    .populate({ path: 'application', select: 'applicationNo student' });

  res.json(new ApiResponse(200, { interviews }));
});

// PATCH /api/interviews/:id/score (FR20 - each panelist scores independently, aggregated)
const submitScore = asyncHandler(async (req, res) => {
  const { scores, remarks } = req.body; // { Communication: 8, 'Subject Knowledge': 9, ... }
  const interview = await Interview.findById(req.params.id);
  if (!interview) throw new ApiError(404, 'Interview not found');

  const values = Object.values(scores);
  const average = values.reduce((a, b) => a + b, 0) / values.length;

  const existingIdx = interview.panelScores.findIndex((s) => String(s.panelist) === String(req.user._id));
  const entry = { panelist: req.user._id, scores, average, remarks, scoredAt: new Date() };
  if (existingIdx >= 0) interview.panelScores[existingIdx] = entry;
  else interview.panelScores.push(entry);

  // Aggregate = average of all panelist averages
  const allAverages = interview.panelScores.map((s) => s.average);
  interview.aggregateScore = Math.round((allAverages.reduce((a, b) => a + b, 0) / allAverages.length) * 100) / 100;
  interview.status = 'Completed';

  // Simple recommendation heuristic: >=7 Selected, 5-7 Waitlisted, <5 Rejected (configurable in future)
  if (interview.aggregateScore >= 7) interview.recommendation = 'Selected';
  else if (interview.aggregateScore >= 5) interview.recommendation = 'Waitlisted';
  else interview.recommendation = 'Rejected';

  await interview.save();

  await Application.findByIdAndUpdate(interview.application, { status: 'Interviewed' });

  res.json(new ApiResponse(200, { interview }, 'Score submitted'));
});

// PATCH /api/interviews/:id/no-show (FR21 - one-time auto-reschedule by default)
const markNoShow = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) throw new ApiError(404, 'Interview not found');

  interview.noShowCount += 1;
  interview.status = interview.noShowCount === 1 ? 'Rescheduled' : 'No-show';
  await interview.save();

  if (interview.noShowCount === 1) {
    // Auto-reschedule: find next available slot in same class with capacity
    const currentSlot = await InterviewSlot.findById(interview.slot);
    const nextSlot = await InterviewSlot.findOne({
      classApplied: currentSlot.classApplied,
      date: { $gt: currentSlot.date },
      $expr: { $lt: ['$booked', '$capacity'] },
    }).sort({ date: 1, startTime: 1 });

    if (nextSlot) {
      interview.slot = nextSlot._id;
      interview.status = 'Scheduled';
      nextSlot.booked += 1;
      await nextSlot.save();
      await interview.save();
    }
  }

  res.json(new ApiResponse(200, { interview }, 'No-show recorded'));
});

module.exports = {
  generateSlots,
  createSlotManually,
  listSlots,
  bookSlot,
  getInterview,
  listInterviews,
  submitScore,
  markNoShow,
};
