const Book = require("../models/Book");
const BookCopy = require("../models/BookCopy");
const { ok, fail } = require("../utils/response");

// GET /api/books?search=&category=&page=&limit=
async function listBooks(req, res) {
  try {
    const orgId = req.currentUser.orgId;
    const { search = "", category = "", page = 1, limit = 10 } = req.query;

    const query = { orgId };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { isbn: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.max(parseInt(limit) || 10, 1);

    const [books, total] = await Promise.all([
      Book.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Book.countDocuments(query),
    ]);

    // Compute live availability per book
    const bookIds = books.map((b) => b._id);
    const copies = await BookCopy.find({ bookId: { $in: bookIds } });
    const withAvailability = books.map((b) => {
      const bookCopies = copies.filter((c) => String(c.bookId) === String(b._id));
      const available = bookCopies.filter((c) => c.status === "Available").length;
      return {
        ...b.toObject(),
        totalPhysicalCopies: bookCopies.length,
        availableCopies: available,
        availabilityLabel: `${available} / ${bookCopies.length} copies available`,
      };
    });

    return ok(res, "Books fetched", {
      books: withAvailability,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// POST /api/books  (admin, teacher)
async function createBook(req, res) {
  try {
    const { title, author, isbn, category, publisher, totalCopies, coverEmoji } = req.body;
    if (!title || !author || !category) {
      return fail(res, "title, author and category are required", 422);
    }
    const book = await Book.create({
      orgId: req.currentUser.orgId,
      title,
      author,
      isbn,
      category,
      publisher,
      totalCopies: totalCopies || 0,
      coverEmoji,
    });
    return ok(res, "Book created", book, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// PUT /api/books/:id  (admin, teacher)
async function updateBook(req, res) {
  try {
    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, orgId: req.currentUser.orgId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!book) return fail(res, "Book not found", 404);
    return ok(res, "Book updated", book);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// DELETE /api/books/:id  (admin only - PRD 5)
async function deleteBook(req, res) {
  try {
    const activeCopies = await BookCopy.countDocuments({
      bookId: req.params.id,
      status: "Issued",
    });
    if (activeCopies > 0) {
      return fail(res, "Cannot delete a book while copies are currently issued", 409);
    }
    const book = await Book.findOneAndDelete({ _id: req.params.id, orgId: req.currentUser.orgId });
    if (!book) return fail(res, "Book not found", 404);
    await BookCopy.deleteMany({ bookId: req.params.id });
    return ok(res, "Book deleted", null);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

module.exports = { listBooks, createBook, updateBook, deleteBook };
