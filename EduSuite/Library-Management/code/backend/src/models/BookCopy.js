const mongoose = require("mongoose");

const bookCopySchema = new mongoose.Schema(
  {
    orgId: { type: String, required: true, default: "demo-school", index: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    barcode: { type: String, required: true, unique: true, trim: true },
    status: {
      type: String,
      enum: ["Available", "Issued", "Lost", "Damaged"],
      default: "Available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BookCopy", bookCopySchema);
