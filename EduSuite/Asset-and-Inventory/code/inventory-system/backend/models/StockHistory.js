const mongoose = require("mongoose");

const stockHistorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: {
      type: String,
      enum: ["Purchase", "Stock In", "Stock Out", "Return", "Adjustment"],
      required: true,
    },
    quantity: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockHistory", stockHistorySchema);
