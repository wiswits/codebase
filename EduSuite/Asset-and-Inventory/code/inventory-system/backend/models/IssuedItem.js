const mongoose = require("mongoose");

const issuedItemLineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    remarks: { type: String, default: "" },
  },
  { _id: false }
);

const issuedItemSchema = new mongoose.Schema(
  {
    issueTo: { type: String, required: true },
    department: { type: String, required: true },
    issueDate: { type: Date, required: true, default: Date.now },
    items: [issuedItemLineSchema],
    status: { type: String, enum: ["Issued", "Returned", "Partially Returned"], default: "Issued" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("IssuedItem", issuedItemSchema);
