import asyncHandler from 'express-async-handler';
import Exam from '../models/Exam.js';
import User from '../models/User.js';
import Result from '../models/Result.js';

// @desc    Get dashboard summary stats + charts
// @route   GET /api/dashboard/summary
// @access  Private
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const [upcomingExams, totalStudents, publishedResults, allResults] = await Promise.all([
    Exam.countDocuments({ status: 'scheduled' }),
    User.countDocuments({ role: 'student', status: 'active' }),
    Result.countDocuments({ status: 'published' }),
    Result.find({ status: 'published' }).select('result'),
  ]);

  const passCount = allResults.filter((r) => r.result === 'pass').length;
  const passPercentage = allResults.length ? ((passCount / allResults.length) * 100).toFixed(2) : 0;

  const upcomingExamList = await Exam.find({ status: 'scheduled' })
    .populate('class', 'name section')
    .sort({ date: 1 })
    .limit(5);

  const monthsBack = 6;
  const now = new Date();
  const reportsOverview = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = await Exam.countDocuments({ date: { $gte: monthDate, $lt: nextMonthDate } });
    reportsOverview.push({
      month: monthDate.toLocaleString('default', { month: 'short' }),
      exams: count,
    });
  }

  res.json({
    success: true,
    data: {
      stats: {
        upcomingExams,
        totalStudents,
        publishedResults,
        passPercentage: Number(passPercentage),
      },
      upcomingExamList,
      reportsOverview,
      passFailDistribution: {
        pass: Number(passPercentage),
        fail: Number((100 - passPercentage).toFixed(2)),
      },
    },
  });
});
