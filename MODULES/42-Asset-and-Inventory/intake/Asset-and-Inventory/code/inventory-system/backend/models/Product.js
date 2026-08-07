const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: String, default: "" },
    model: { type: String, default: "" },
    sku: { type: String, required: true, unique: true, trim: true },
    purchasePrice: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    quantity: { type: Number, required: true, default: 0 },
    minStock: { type: Number, required: true, default: 5 },
    location: { type: String, default: "" },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

productSchema.virtual("status").get(function () {
  if (this.quantity <= 0) return "Out of Stock";
  if (this.quantity <= this.minStock) return "Low Stock";
  return "In Stock";
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
