const BookCopy = require("../models/BookCopy");
const Book = require("../models/Book");
const { ok, fail } = require("../utils/response");

// GET /api/copies?bookId=&status=
async function listCopies(req, res) {
  try {
    const { bookId, status } = req.query;
    const query = { orgId: req.currentUser.orgId };
    if (bookId) query.bookId = bookId;
    if (status) query.status = status;

    const copies = await BookCopy.find(query).populate("bookId", "title author coverEmoji").sort({ createdAt: -1 });
    return ok(res, "Copies fetched", copies);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// POST /api/copies  (admin, teacher) - add a new physical copy
async function addCopy(req, res) {
  try {
    const { bookId, barcode } = req.body;
    if (!bookId || !barcode) return fail(res, "bookId and barcode are required", 422);

    const book = await Book.findOne({ _id: bookId, orgId: req.currentUser.orgId });
    if (!book) return fail(res, "Book not found", 404);

    const copy = await BookCopy.create({
      orgId: req.currentUser.orgId,
      bookId,
      barcode,
      status: "Available",
    });
    book.totalCopies += 1;
    await book.save();

    return ok(res, "Copy added", copy, 201);
  } catch (err) {
    if (err.code === 11000) return fail(res, "Barcode already exists", 409);
    return fail(res, err.message, 500);
  }
}

// PATCH /api/copies/:id/status  (admin, teacher) - mark lost/damaged/available
async function updateCopyStatus(req, res) {
  try {
    const { status } = req.body;
    if (!["Available", "Lost", "Damaged"].includes(status)) {
      return fail(res, "status must be Available, Lost or Damaged", 422);
    }
    const copy = await BookCopy.findOne({ _id: req.params.id, orgId: req.currentUser.orgId });
    if (!copy) return fail(res, "Copy not found", 404);
    if (copy.status === "Issued") {
      return fail(res, "Cannot change status of a copy that is currently issued", 409);
    }
    copy.status = status;
    await copy.save();
    return ok(res, "Copy status updated", copy);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// DELETE /api/copies/:id  (admin only) - blocked while issued
async function deleteCopy(req, res) {
  try {
    const copy = await BookCopy.findOne({ _id: req.params.id, orgId: req.currentUser.orgId });
    if (!copy) return fail(res, "Copy not found", 404);
    if (copy.status === "Issued") {
      return fail(res, "Cannot delete a copy that is currently issued", 409);
    }
    await copy.deleteOne();
    await Book.findByIdAndUpdate(copy.bookId, { $inc: { totalCopies: -1 } });
    return ok(res, "Copy deleted", null);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

module.exports = { listCopies, addCopy, updateCopyStatus, deleteCopy };
