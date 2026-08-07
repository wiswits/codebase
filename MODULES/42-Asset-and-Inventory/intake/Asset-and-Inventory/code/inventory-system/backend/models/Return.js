const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema(
  {
    issuedItem: { type: mongoose.Schema.Types.ObjectId, ref: "IssuedItem" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    condition: { type: String, enum: ["Good", "Damaged", "Needs Repair"], default: "Good" },
    returnDate: { type: Date, required: true, default: Date.now },
    remarks: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Return", returnSchema);
