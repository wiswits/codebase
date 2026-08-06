const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    orgId: { type: String, required: true, default: "demo-school", index: true },
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    publisher: { type: String, trim: true },
    totalCopies: { type: Number, required: true, default: 0, min: 0 },
    coverEmoji: { type: String, default: "📘" },
  },
  { timestamps: true }
);

bookSchema.index({ title: "text", author: "text", isbn: "text" });

module.exports = mongoose.model("Book", bookSchema);
