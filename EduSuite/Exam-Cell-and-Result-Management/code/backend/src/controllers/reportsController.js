import asyncHandler from 'express-async-handler';
import Result from '../models/Result.js';
import Exam from '../models/Exam.js';
import Subject from '../models/Subject.js';

// @desc    Pass/fail trend across recent exams (optionally filtered by class)
// @route   GET /api/reports/pass-fail-trend
// @access  Private
export const getPassFailTrend = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.class) query.class = req.query.class;

  const examIds = await Result.distinct('exam', query);
  const exams = await Exam.find({ _id: { $in: examIds } }).sort({ date: 1 }).limit(12);

  const trend = [];
  for (const exam of exams) {
    const results = await Result.find({ exam: exam._id, ...(req.query.class ? { class: req.query.class } : {}) });
    if (results.length === 0) continue;
    const passed = results.filter((r) => r.result === 'pass').length;
    trend.push({
      exam: exam.name,
      date: exam.date,
      passPercentage: Number(((passed / results.length) * 100).toFixed(2)),
      failPercentage: Number((((results.length - passed) / results.length) * 100).toFixed(2)),
    });
  }

  res.json({ success: true, data: trend });
});

// @desc    Subject-wise average pass percentage (optionally filtered by class)
// @route   GET /api/reports/subject-performance
// @access  Private
export const getSubjectPerformance = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.class) query.class = req.query.class;

  const examIds = await Result.distinct('exam', query);
  const exams = await Exam.find({ _id: { $in: examIds } }).populate('subject', 'name');

  const bySubject = {};
  for (const exam of exams) {
    const results = await Result.find({ exam: exam._id, ...(req.query.class ? { class: req.query.class } : {}) });
    if (results.length === 0 || !exam.subject) continue;
    const subjectName = exam.subject.name;
    if (!bySubject[subjectName]) bySubject[subjectName] = { totalPercentage: 0, count: 0 };
    const avgPercentage = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
    bySubject[subjectName].totalPercentage += avgPercentage;
    bySubject[subjectName].count += 1;
  }

  const data = Object.entries(bySubject).map(([subject, agg]) => ({
    subject,
    avgPassPercentage: Number((agg.totalPercentage / agg.count).toFixed(2)),
  }));

  res.json({ success: true, data });
});

// @desc    Generate a full pass/fail examination report for a specific exam + class
// @route   GET /api/reports/examination
// @access  Private
export const getExaminationReport = asyncHandler(async (req, res) => {
  const { examId } = req.query;
  if (!examId) {
    res.status(400);
    throw new Error('examId query parameter is required');
  }

  const results = await Result.find({ exam: examId }).populate('student', 'name rollNo').sort({ rank: 1 });
  const totalStudents = results.length;
  const passed = results.filter((r) => r.result === 'pass').length;
  const failed = totalStudents - passed;
  const passPercentage = totalStudents ? Number(((passed / totalStudents) * 100).toFixed(2)) : 0;

  res.json({
    success: true,
    data: { totalStudents, passed, failed, passPercentage, results },
  });
});
