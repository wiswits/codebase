const Book = require("../models/Book");
const BookCopy = require("../models/BookCopy");
const IssueRecord = require("../models/IssueRecord");
const { ok, fail } = require("../utils/response");

const FINE_PER_DAY = Number(process.env.FINE_PER_DAY) || 2;

function daysBetween(a, b) {
  return Math.max(0, Math.ceil((a - b) / (1000 * 60 * 60 * 24)));
}

// GET /api/stats/summary - live counters for the dashboard
async function summary(req, res) {
  try {
    const orgId = req.currentUser.orgId;
    const [totalBooks, totalCopies, availableCopies, issuedCopies] = await Promise.all([
      Book.countDocuments({ orgId }),
      BookCopy.countDocuments({ orgId }),
      BookCopy.countDocuments({ orgId, status: "Available" }),
      BookCopy.countDocuments({ orgId, status: "Issued" }),
    ]);

    const now = new Date();
    const overdueRecords = await IssueRecord.find({ orgId, status: "Issued", dueDate: { $lt: now } });
    const overdueCount = overdueRecords.length;
    const outstandingFines = overdueRecords.reduce(
      (sum, r) => sum + daysBetween(now, r.dueDate) * FINE_PER_DAY,
      0
    );

    return ok(res, "Summary fetched", {
      totalBooks,
      totalCopies,
      availableCopies,
      issuedCopies,
      overdueCount,
      outstandingFines,
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// GET /api/stats/most-issued - usage trends
async function mostIssued(req, res) {
  try {
    const orgId = req.currentUser.orgId;
    const agg = await IssueRecord.aggregate([
      { $match: { orgId } },
      { $group: { _id: "$bookId", issueCount: { $sum: 1 } } },
      { $sort: { issueCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "book" } },
      { $unwind: "$book" },
      { $project: { title: "$book.title", author: "$book.author", issueCount: 1 } },
    ]);
    return ok(res, "Most issued books fetched", agg);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// GET /api/stats/category-breakdown - books grouped by category
async function categoryBreakdown(req, res) {
  try {
    const orgId = req.currentUser.orgId;
    const agg = await Book.aggregate([
      { $match: { orgId } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return ok(res, "Category breakdown fetched", agg.map((a) => ({ category: a._id, count: a.count })));
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// GET /api/stats/copy-availability - available vs issued
async function copyAvailability(req, res) {
  try {
    const orgId = req.currentUser.orgId;
    const [available, issued, lost, damaged] = await Promise.all([
      BookCopy.countDocuments({ orgId, status: "Available" }),
      BookCopy.countDocuments({ orgId, status: "Issued" }),
      BookCopy.countDocuments({ orgId, status: "Lost" }),
      BookCopy.countDocuments({ orgId, status: "Damaged" }),
    ]);
    return ok(res, "Copy availability fetched", { available, issued, lost, damaged });
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// GET /api/stats/issue-return-trend - last 7 days issued vs returned
async function issueReturnTrend(req, res) {
  try {
    const orgId = req.currentUser.orgId;
    const days = 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [issuedCount, returnedCount] = await Promise.all([
        IssueRecord.countDocuments({ orgId, issueDate: { $gte: dayStart, $lt: dayEnd } }),
        IssueRecord.countDocuments({ orgId, returnDate: { $gte: dayStart, $lt: dayEnd } }),
      ]);

      trend.push({
        day: dayStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        issued: issuedCount,
        returned: returnedCount,
      });
    }
    return ok(res, "Issue/return trend fetched", trend);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

module.exports = { summary, mostIssued, categoryBreakdown, copyAvailability, issueReturnTrend };
