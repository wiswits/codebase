const IssueRecord = require("../models/IssueRecord");
const User = require("../models/User");
const { ok, fail } = require("../utils/response");

const FINE_PER_DAY = Number(process.env.FINE_PER_DAY) || 2;

function daysBetween(a, b) {
  return Math.max(0, Math.ceil((a - b) / (1000 * 60 * 60 * 24)));
}

// GET /api/my-books
// Students/teachers see their own records. Parents see their linked child's records.
async function myBooks(req, res) {
  try {
    const user = req.currentUser;
    let targetUserId = user._id;

    if (user.role === "parent") {
      if (!user.linkedStudentId) return fail(res, "No linked student found for this parent account", 404);
      targetUserId = user.linkedStudentId;
    }

    const records = await IssueRecord.find({ orgId: user.orgId, userId: targetUserId })
      .populate("bookId", "title author coverEmoji")
      .populate("copyId", "barcode")
      .sort({ issueDate: -1 });

    const now = new Date();
    const withFines = records.map((r) => {
      const obj = r.toObject();
      const isOverdue = r.status === "Issued" && r.dueDate < now;
      obj.isOverdue = isOverdue;
      obj.currentFine = isOverdue ? daysBetween(now, r.dueDate) * FINE_PER_DAY : r.fineAmount;
      return obj;
    });

    const targetUser = await User.findById(targetUserId).select("name role studentCode");

    return ok(res, "My books fetched", { student: targetUser, records: withFines });
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

module.exports = { myBooks };
