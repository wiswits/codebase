import asyncHandler from 'express-async-handler';
import Mark from '../models/Mark.js';
import Exam from '../models/Exam.js';
import User from '../models/User.js';

// @desc    Get the class roster + existing marks for an exam (used by the marks entry grid)
// @route   GET /api/marks/sheet/:examId
// @access  Private (Admin, Teacher, Exam Controller)
export const getMarksSheet = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId).populate('class subject');
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  const students = await User.find({ role: 'student', classAssigned: exam.class._id, status: 'active' }).sort({ rollNo: 1 });
  const existingMarks = await Mark.find({ exam: exam._id, subject: exam.subject._id });
  const marksByStudent = {};
  existingMarks.forEach((m) => {
    marksByStudent[String(m.student)] = m;
  });

  const rows = students.map((student) => ({
    student: { _id: student._id, name: student.name, rollNo: student.rollNo },
    mark: marksByStudent[String(student._id)] || null,
  }));

  res.json({ success: true, data: { exam, rows } });
});

// @desc    Bulk save/update marks for an exam
// @route   POST /api/marks/bulk
// @access  Private (Admin, Teacher, Exam Controller)
export const bulkSaveMarks = asyncHandler(async (req, res) => {
  const { examId, subjectId, entries } = req.body;
  if (!Array.isArray(entries) || entries.length === 0) {
    res.status(400);
    throw new Error('No mark entries provided');
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  const results = [];
  for (const entry of entries) {
    const isAbsent = !!entry.isAbsent;
    let marksObtained = 0;

    if (!isAbsent) {
      if (entry.marksObtained === '' || entry.marksObtained === null || entry.marksObtained === undefined) continue;
      marksObtained = Number(entry.marksObtained);
      if (Number.isNaN(marksObtained) || marksObtained < 0 || marksObtained > exam.totalMarks) continue;
    }

    const mark = await Mark.findOneAndUpdate(
      { exam: examId, student: entry.studentId, subject: subjectId || exam.subject },
      {
        exam: examId,
        student: entry.studentId,
        subject: subjectId || exam.subject,
        maxMarks: exam.totalMarks,
        marksObtained,
        isAbsent,
        remarks: entry.remarks || '',
        enteredBy: req.user._id,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    results.push(mark);
  }

  res.status(201).json({ success: true, count: results.length, data: results });
});

// @desc    Get marks pending or completed moderation for an exam
// @route   GET /api/marks/moderation/:examId
// @access  Private (Admin, Exam Controller, Principal)
export const getModerationQueue = asyncHandler(async (req, res) => {
  const marks = await Mark.find({ exam: req.params.examId })
    .populate('student', 'name rollNo')
    .populate('subject', 'name')
    .populate('enteredBy', 'name')
    .sort({ 'student.rollNo': 1 });

  res.json({ success: true, data: marks });
});

// @desc    Apply a moderation adjustment to a single mark
// @route   PUT /api/marks/:id/moderate
// @access  Private (Admin, Exam Controller, Principal)
export const moderateMark = asyncHandler(async (req, res) => {
  const { moderatedMarks, reason } = req.body;
  if (!reason || reason.trim().length < 10) {
    res.status(400);
    throw new Error('A moderation reason of at least 10 characters is required');
  }
  const mark = await Mark.findById(req.params.id);
  if (!mark) {
    res.status(404);
    throw new Error('Mark record not found');
  }
  mark.moderated = true;
  mark.moderatedMarks = Number(moderatedMarks);
  mark.moderationReason = reason.trim();
  mark.moderatedBy = req.user._id;
  await mark.save();
  const populated = await mark.populate([{ path: 'student', select: 'name rollNo' }, { path: 'subject', select: 'name' }]);
  res.json({ success: true, data: populated });
});
