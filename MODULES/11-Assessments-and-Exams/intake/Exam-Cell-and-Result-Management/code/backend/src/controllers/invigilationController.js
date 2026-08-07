import asyncHandler from 'express-async-handler';
import Invigilation from '../models/Invigilation.js';
import Exam from '../models/Exam.js';
import { logAction } from '../utils/auditLog.js';

// @desc    Get invigilation assignments (optionally filter by date)
// @route   GET /api/invigilation
// @access  Private
export const getInvigilations = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.date) {
    const start = new Date(req.query.date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query.date = { $gte: start, $lt: end };
  }
  if (req.query.exam) query.exam = req.query.exam;

  const assignments = await Invigilation.find(query)
    .populate({ path: 'exam', populate: 'class subject' })
    .populate('invigilators', 'name email')
    .sort({ date: 1, startTime: 1 });

  res.json({ success: true, data: assignments });
});

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const overlaps = (startA, endA, startB, endB) => toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);

// @desc    Auto-assign invigilators to every scheduled exam on a given date
// @route   POST /api/invigilation/auto-assign
// @access  Private (Admin, Exam Controller)
export const autoAssignInvigilators = asyncHandler(async (req, res) => {
  const { date } = req.body;
  if (!date) {
    res.status(400);
    throw new Error('Date is required for auto-assignment');
  }

  const start = new Date(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const exams = await Exam.find({ date: { $gte: start, $lt: end } }).sort({ startTime: 1 });
  if (exams.length === 0) {
    res.status(404);
    throw new Error('No exams scheduled on this date');
  }

  const User = (await import('../models/User.js')).default;
  const invigilatorPool = await User.find({ role: 'invigilator', status: 'active' });
  if (invigilatorPool.length === 0) {
    res.status(400);
    throw new Error('No active invigilators found. Add invigilators in User Management first.');
  }

  // Tracks which time windows each invigilator is already committed to today,
  // so the same person is never double-booked into two overlapping exams.
  const busy = {};
  invigilatorPool.forEach((inv) => { busy[String(inv._id)] = []; });

  const isFree = (invigilatorId, exam) =>
    !busy[String(invigilatorId)].some((slot) => overlaps(exam.startTime, exam.endTime, slot.startTime, slot.endTime));

  const created = [];
  const unassignedExams = [];
  let cursor = 0;

  for (const exam of exams) {
    const eligible = [];
    for (let tries = 0; tries < invigilatorPool.length; tries += 1) {
      const candidate = invigilatorPool[(cursor + tries) % invigilatorPool.length];
      if (isFree(candidate._id, exam)) eligible.push(candidate);
      if (eligible.length >= 2) break;
    }

    if (eligible.length === 0) {
      unassignedExams.push(exam.name);
      continue;
    }

    const invigilatorIds = eligible.map((e) => e._id);
    eligible.forEach((inv) => {
      busy[String(inv._id)].push({ startTime: exam.startTime, endTime: exam.endTime });
    });
    cursor += 1;

    let assignment = await Invigilation.findOne({ exam: exam._id, room: exam.room });
    if (assignment) {
      assignment.invigilators = invigilatorIds;
      await assignment.save();
    } else {
      assignment = await Invigilation.create({
        exam: exam._id,
        room: exam.room || 'TBD',
        date: exam.date,
        startTime: exam.startTime,
        endTime: exam.endTime,
        invigilators: invigilatorIds,
      });
    }
    created.push(assignment);
  }

  const details = `Assigned invigilators for ${created.length} exam(s) on ${date}` + (unassignedExams.length ? `; could not cover: ${unassignedExams.join(', ')}` : '');
  await logAction({ userId: req.user._id, action: 'auto_assign', module: 'Invigilation', details, req });

  const populated = await Invigilation.populate(created, [{ path: 'exam', populate: 'class subject' }, { path: 'invigilators', select: 'name email' }]);
  res.status(201).json({ success: true, data: populated, unassignedExams });
});

// @desc    Manually create/update an assignment
// @route   POST /api/invigilation
// @access  Private (Admin, Exam Controller)
export const createInvigilation = asyncHandler(async (req, res) => {
  const assignment = await Invigilation.create(req.body);
  const populated = await assignment.populate([{ path: 'exam', populate: 'class subject' }, { path: 'invigilators', select: 'name email' }]);
  res.status(201).json({ success: true, data: populated });
});

// @desc    Update assignment (change invigilators / status)
// @route   PUT /api/invigilation/:id
// @access  Private (Admin, Exam Controller, Invigilator - confirm own status)
export const updateInvigilation = asyncHandler(async (req, res) => {
  const assignment = await Invigilation.findById(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error('Invigilation assignment not found');
  }
  Object.assign(assignment, req.body);
  await assignment.save();
  const populated = await assignment.populate([{ path: 'exam', populate: 'class subject' }, { path: 'invigilators', select: 'name email' }]);
  res.json({ success: true, data: populated });
});

// @desc    Delete assignment
// @route   DELETE /api/invigilation/:id
// @access  Private (Admin, Exam Controller)
export const deleteInvigilation = asyncHandler(async (req, res) => {
  const assignment = await Invigilation.findById(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error('Invigilation assignment not found');
  }
  await assignment.deleteOne();
  res.json({ success: true, message: 'Assignment removed' });
});
