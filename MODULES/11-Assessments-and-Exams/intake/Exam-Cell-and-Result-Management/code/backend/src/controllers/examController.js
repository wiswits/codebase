import asyncHandler from 'express-async-handler';
import Exam from '../models/Exam.js';
import { logAction } from '../utils/auditLog.js';

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Returns the first exam that clashes with the given class/date/time window
// (same class, same date, overlapping time range), excluding excludeId on updates.
const findClash = async (classId, date, startTime, endTime, excludeId) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const query = { class: classId, date: { $gte: dayStart, $lt: dayEnd }, status: { $ne: 'cancelled' } };
  if (excludeId) query._id = { $ne: excludeId };

  const sameDayExams = await Exam.find(query).populate('subject', 'name');
  const newStart = toMinutes(startTime);
  const newEnd = toMinutes(endTime);

  return sameDayExams.find((exam) => {
    const existingStart = toMinutes(exam.startTime);
    const existingEnd = toMinutes(exam.endTime);
    return newStart < existingEnd && existingStart < newEnd;
  });
};

// @desc    Get all exams (with filtering, search, pagination, sorting)
// @route   GET /api/exams
// @access  Private
export const getExams = asyncHandler(async (req, res) => {
  const { search, status, examType, class: classId, month, year, page = 1, limit = 20, sortBy = 'date', order = 'asc' } = req.query;

  const query = {};
  if (status) query.status = status;
  if (examType) query.examType = examType;
  if (classId) query.class = classId;
  if (search) query.name = { $regex: search, $options: 'i' };

  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);
    query.date = { $gte: start, $lt: end };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortOrder = order === 'desc' ? -1 : 1;

  const [exams, total] = await Promise.all([
    Exam.find(query)
      .populate('class', 'name section')
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    Exam.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: exams,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    },
  });
});

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
export const getExamById = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id).populate('class subject createdBy');
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }
  res.json({ success: true, data: exam });
});

// @desc    Create exam
// @route   POST /api/exams
// @access  Private (Admin, Exam Controller)
export const createExam = asyncHandler(async (req, res) => {
  const { class: classId, date, startTime, endTime } = req.body;
  const clash = await findClash(classId, date, startTime, endTime);
  if (clash) {
    res.status(409);
    throw new Error(
      `Clash detected: this class already has "${clash.name}" (${clash.subject?.name || ''}) scheduled from ${clash.startTime} to ${clash.endTime} on this date.`
    );
  }

  const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
  const populated = await exam.populate('class subject createdBy');
  await logAction({ userId: req.user._id, action: 'create', module: 'Exam Scheduler', details: `Scheduled exam: ${exam.name}`, req });
  res.status(201).json({ success: true, data: populated });
});

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Admin, Exam Controller)
export const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  const classId = req.body.class || exam.class;
  const date = req.body.date || exam.date;
  const startTime = req.body.startTime || exam.startTime;
  const endTime = req.body.endTime || exam.endTime;
  const clash = await findClash(classId, date, startTime, endTime, exam._id);
  if (clash) {
    res.status(409);
    throw new Error(
      `Clash detected: this class already has "${clash.name}" (${clash.subject?.name || ''}) scheduled from ${clash.startTime} to ${clash.endTime} on this date.`
    );
  }

  Object.assign(exam, req.body);
  await exam.save();
  const populated = await exam.populate('class subject createdBy');
  res.json({ success: true, data: populated });
});

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Admin, Exam Controller)
export const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }
  await exam.deleteOne();
  await logAction({ userId: req.user._id, action: 'delete', module: 'Exam Scheduler', details: `Deleted exam: ${exam.name}`, req });
  res.json({ success: true, message: 'Exam deleted successfully' });
});

// @desc    Get calendar view of exams for a given month/year
// @route   GET /api/exams/calendar
// @access  Private
export const getExamCalendar = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const m = Number(month) || new Date().getMonth() + 1;
  const y = Number(year) || new Date().getFullYear();
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const exams = await Exam.find({ date: { $gte: start, $lt: end } })
    .populate('class', 'name section')
    .populate('subject', 'name')
    .sort({ date: 1 });

  res.json({ success: true, data: exams });
});
