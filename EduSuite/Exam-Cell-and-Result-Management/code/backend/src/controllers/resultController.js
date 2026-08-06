import asyncHandler from 'express-async-handler';
import PDFDocument from 'pdfkit';
import Mark from '../models/Mark.js';
import Result from '../models/Result.js';
import Exam from '../models/Exam.js';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
import { calculateGrade } from '../utils/grade.js';
import { logAction } from '../utils/auditLog.js';
import { notifyMany } from '../utils/notify.js';
import { sendEmail } from '../utils/email.js';

// @desc    Process results for an exam from entered/moderated marks
// @route   POST /api/results/process/:examId
// @access  Private (Admin, Exam Controller)
export const processResults = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId).populate('class');
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  const marks = await Mark.find({ exam: exam._id }).populate('student', 'name rollNo');
  if (marks.length === 0) {
    res.status(400);
    throw new Error('No marks have been entered for this exam yet');
  }

  const settings = (await Settings.findOne()) || (await Settings.create({}));
  const passingPercent = settings.passingPercent || 33;

  const scored = marks.map((m) => {
    const finalMarks = m.moderated && m.moderatedMarks !== undefined ? m.moderatedMarks : m.marksObtained;
    const percentage = m.isAbsent ? 0 : Number(((finalMarks / m.maxMarks) * 100).toFixed(2));
    return { mark: m, finalMarks, percentage };
  });

  // Rank only among present students — an absent student shouldn't occupy or shift rank slots.
  const present = scored.filter((s) => !s.mark.isAbsent).sort((a, b) => b.percentage - a.percentage);
  const absent = scored.filter((s) => s.mark.isAbsent);

  const rankMap = new Map();
  let rank = 0;
  let prevPercentage = null;
  present.forEach((s, i) => {
    if (s.percentage !== prevPercentage) {
      rank = i + 1;
      prevPercentage = s.percentage;
    }
    rankMap.set(String(s.mark._id), rank);
  });

  const results = [];
  for (const s of [...present, ...absent]) {
    const { mark, finalMarks, percentage } = s;

    const result = await Result.findOneAndUpdate(
      { exam: exam._id, student: mark.student._id },
      {
        exam: exam._id,
        student: mark.student._id,
        class: exam.class._id,
        totalMarks: mark.maxMarks,
        marksObtained: finalMarks,
        percentage,
        isAbsent: mark.isAbsent,
        grade: mark.isAbsent ? 'AB' : calculateGrade(percentage, settings.gradingScale),
        rank: mark.isAbsent ? null : rankMap.get(String(mark._id)),
        result: !mark.isAbsent && percentage >= passingPercent ? 'pass' : 'fail',
        status: 'draft',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    results.push(result);
  }

  await logAction({ userId: req.user._id, action: 'process_results', module: 'Result Processing', details: `Processed ${results.length} result(s) for exam ${exam.name}`, req });

  const populated = await Result.populate(results, { path: 'student', select: 'name rollNo' });
  res.status(201).json({ success: true, count: populated.length, data: populated });
});

// @desc    Get results for an exam (sorted by rank)
// @route   GET /api/results/exam/:examId
// @access  Private
export const getResultsByExam = asyncHandler(async (req, res) => {
  const results = await Result.find({ exam: req.params.examId })
    .populate('student', 'name rollNo')
    .populate('class', 'name section')
    .sort({ rank: 1 });
  res.json({ success: true, data: results });
});

// @desc    Get result processing summary (totals, pass %, grade distribution)
// @route   GET /api/results/summary/:examId
// @access  Private
export const getResultSummary = asyncHandler(async (req, res) => {
  const results = await Result.find({ exam: req.params.examId });
  const totalStudents = results.length;
  const absent = results.filter((r) => r.isAbsent).length;
  const present = totalStudents - absent;
  const passed = results.filter((r) => r.result === 'pass').length;
  const failed = present - passed;
  const passPercentage = present ? Number(((passed / present) * 100).toFixed(2)) : 0;

  const gradeCount = {};
  results.forEach((r) => {
    gradeCount[r.grade] = (gradeCount[r.grade] || 0) + 1;
  });
  const gradeDistribution = Object.entries(gradeCount)
    .map(([grade, count]) => ({ grade, count, percentage: totalStudents ? Number(((count / totalStudents) * 100).toFixed(2)) : 0 }))
    .sort((a, b) => a.grade.localeCompare(b.grade));

  res.json({
    success: true,
    data: { totalStudents, present, absent, passed, failed, passPercentage, gradeDistribution },
  });
});

// @desc    Update result workflow status (draft -> reviewed -> approved -> published) for a whole exam
// @route   PUT /api/results/status/:examId
// @access  Private (Admin, Exam Controller, Principal)
export const updateResultStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['draft', 'reviewed', 'approved', 'published'];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error('Invalid status value');
  }

  const update = { status };
  if (status === 'published') update.publishedAt = new Date();

  await Result.updateMany({ exam: req.params.examId }, update);
  await logAction({ userId: req.user._id, action: `status_${status}`, module: 'Result Publishing', details: `Set status to ${status} for exam ${req.params.examId}`, req });

  const results = await Result.find({ exam: req.params.examId }).populate('student', 'name rollNo email').sort({ rank: 1 });

  if (status === 'published') {
    const exam = await Exam.findById(req.params.examId);
    await notifyMany(results.map((r) => r.student._id), {
      title: 'Result Published',
      message: `Your result for ${exam?.name || 'the exam'} has been published.`,
      type: 'success',
      link: '/my-results',
    });

    // Fire-and-forget emails so a slow/misconfigured SMTP server never blocks the response.
    results.forEach((r) => {
      if (r.student?.email) {
        sendEmail({
          to: r.student.email,
          subject: `Result Published — ${exam?.name || 'Exam'}`,
          html: `<p>Hi ${r.student.name},</p><p>Your result for <strong>${exam?.name || 'the exam'}</strong> has been published. You scored <strong>${r.marksObtained}/${r.totalMarks}</strong> (${r.percentage}%), Grade <strong>${r.grade}</strong>.</p><p>Log in to ECRMS to view the full breakdown.</p>`,
        }).catch(() => {});
      }
    });
  }

  res.json({ success: true, data: results });
});

// @desc    Get published results for the logged-in student
// @route   GET /api/results/my
// @access  Private (Student)
export const getMyResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ student: req.user._id, status: 'published' })
    .populate({ path: 'exam', populate: 'subject class' })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: results });
});

// @desc    Download a single student's marksheet as PDF
// @route   GET /api/results/:id/pdf
// @access  Private
export const downloadMarksheetPdf = asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.id)
    .populate('student', 'name rollNo')
    .populate({ path: 'exam', populate: 'subject class' })
    .populate('class', 'name section');

  if (!result) {
    res.status(404);
    throw new Error('Result not found');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=marksheet-${result.student.rollNo || result._id}.pdf`);

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(res);

  doc.rect(0, 0, doc.page.width, 90).fill('#3FA46A');
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('ECRMS', 40, 30);
  doc.fontSize(12).font('Helvetica').text('Official Marksheet', 40, 58);

  doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text(result.exam?.name || 'Examination', 40, 115);
  doc.moveDown(1);

  const rows = [
    ['Student Name', result.student.name],
    ['Roll No', result.student.rollNo || '-'],
    ['Class', `${result.class?.name || ''} ${result.class?.section || ''}`],
    ['Subject', result.exam?.subject?.name || '-'],
    ['Marks Obtained', `${result.marksObtained} / ${result.totalMarks}`],
    ['Percentage', `${result.percentage}%`],
    ['Grade', result.grade],
    ['Rank', `#${result.rank}`],
    ['Result', result.result.toUpperCase()],
  ];

  let y = doc.y + 15;
  rows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').fontSize(11).text(`${label}:`, 40, y, { width: 180 });
    doc.font('Helvetica').fontSize(11).text(String(value), 230, y);
    y += 24;
  });

  doc.fontSize(8).fillColor('#94a3b8').text('This is a computer generated marksheet and does not require a signature.', 40, doc.page.height - 60, {
    width: doc.page.width - 80,
    align: 'center',
  });

  doc.end();
});

// @desc    Get exams that have processed results (used to populate module dropdowns)
// @route   GET /api/results/exams-with-results
// @access  Private
export const getExamsWithResults = asyncHandler(async (req, res) => {
  const examIds = await Result.distinct('exam');
  const exams = await Exam.find({ _id: { $in: examIds } })
    .populate('class', 'name section')
    .populate('subject', 'name')
    .sort({ date: -1 });
  res.json({ success: true, data: exams });
});
