const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const StockHistory = require("../models/StockHistory");

// @desc  Add additional quantity to a product directly (not via a vendor purchase)
// @route POST /api/stock-in
const stockIn = asyncHandler(async (req, res) => {
  const { productId, quantity, note } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    res.status(400);
    throw new Error("Please provide a valid product and quantity");
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  product.quantity += Number(quantity);
  await product.save();

  const history = await StockHistory.create({
    product: product._id,
    user: req.user?._id,
    action: "Stock In",
    quantity,
    note: note || "Manual stock in",
  });

  res.status(201).json({ product, history });
});

const getStockInHistory = asyncHandler(async (req, res) => {
  const records = await StockHistory.find({ action: "Stock In" })
    .populate("product", "name sku")
    .populate("user", "name")
    .sort({ createdAt: -1 });
  res.json(records);
});

module.exports = { stockIn, getStockInHistory };
