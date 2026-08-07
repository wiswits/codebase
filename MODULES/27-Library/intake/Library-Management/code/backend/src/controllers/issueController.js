const IssueRecord = require("../models/IssueRecord");
const BookCopy = require("../models/BookCopy");
const { ok, fail } = require("../utils/response");

const FINE_PER_DAY = Number(process.env.FINE_PER_DAY) || 2;
const DEFAULT_LOAN_DAYS = Number(process.env.DEFAULT_LOAN_DAYS) || 14;

function daysBetween(a, b) {
  return Math.max(0, Math.ceil((a - b) / (1000 * 60 * 60 * 24)));
}

// GET /api/issue-register?status=All|Issued|Returned&overdueOnly=true
async function listRegister(req, res) {
  try {
    const { status, overdueOnly } = req.query;
    const query = { orgId: req.currentUser.orgId };
    if (status && status !== "All") query.status = status;

    let records = await IssueRecord.find(query)
      .populate("bookId", "title author coverEmoji")
      .populate("copyId", "barcode")
      .populate("userId", "name role studentCode")
      .sort({ issueDate: -1 });

    const now = new Date();
    records = records.map((r) => {
      const obj = r.toObject();
      const isOverdue = r.status === "Issued" && r.dueDate < now;
      obj.daysOverdue = isOverdue ? daysBetween(now, r.dueDate) : 0;
      obj.isOverdue = isOverdue;
      obj.computedFine = isOverdue ? obj.daysOverdue * FINE_PER_DAY : r.fineAmount;
      return obj;
    });

    if (overdueOnly === "true") {
      records = records.filter((r) => r.isOverdue).sort((a, b) => b.daysOverdue - a.daysOverdue);
    }

    return ok(res, "Issue register fetched", records);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// POST /api/issue-register/issue  (admin, teacher)
// body: { copyId, userId, dueInDays? }
async function issueBook(req, res) {
  try {
    const { copyId, userId, dueInDays } = req.body;
    if (!copyId || !userId) return fail(res, "copyId and userId are required", 422);

    const copy = await BookCopy.findOne({ _id: copyId, orgId: req.currentUser.orgId });
    if (!copy) return fail(res, "Copy not found", 404);
    if (copy.status !== "Available") {
      return fail(res, `Copy is currently ${copy.status.toLowerCase()}, not available to issue`, 409);
    }

    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + (dueInDays || DEFAULT_LOAN_DAYS));

    const record = await IssueRecord.create({
      orgId: req.currentUser.orgId,
      bookId: copy.bookId,
      copyId: copy._id,
      userId,
      issueDate,
      dueDate,
      status: "Issued",
      issuedBy: req.currentUser._id,
    });

    copy.status = "Issued";
    await copy.save();

    return ok(res, "Book issued successfully", record, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// POST /api/issue-register/:id/return  (admin, teacher)
// Automatically calculates overdue fine at FINE_PER_DAY and frees the copy.
async function returnBook(req, res) {
  try {
    const record = await IssueRecord.findOne({ _id: req.params.id, orgId: req.currentUser.orgId });
    if (!record) return fail(res, "Issue record not found", 404);
    if (record.status === "Returned") return fail(res, "This book was already returned", 409);

    const returnDate = new Date();
    const overdueDays = daysBetween(returnDate, record.dueDate);
    const fine = overdueDays * FINE_PER_DAY;

    record.returnDate = returnDate;
    record.status = "Returned";
    record.fineAmount = fine;
    await record.save();

    await BookCopy.findByIdAndUpdate(record.copyId, { status: "Available" });

    return ok(res, fine > 0 ? `Book returned. Fine of ₹${fine} applies (${overdueDays} day(s) late).` : "Book returned on time. No fine.", record);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

module.exports = { listRegister, issueBook, returnBook };
