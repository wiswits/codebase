const mongoose = require("mongoose");

const issueRecordSchema = new mongoose.Schema(
  {
    orgId: { type: String, required: true, default: "demo-school", index: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    copyId: { type: mongoose.Schema.Types.ObjectId, ref: "BookCopy", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Issued", "Returned"],
      default: "Issued",
    },
    fineAmount: { type: Number, default: 0 },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // librarian/admin who issued
  },
  { timestamps: true }
);

module.exports = mongoose.model("IssueRecord", issueRecordSchema);
