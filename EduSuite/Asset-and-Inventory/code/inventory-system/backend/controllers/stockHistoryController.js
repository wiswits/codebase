const asyncHandler = require("express-async-handler");
const StockHistory = require("../models/StockHistory");

// @desc  Get complete transaction log with optional filters
// @route GET /api/inventory-history
const getHistory = asyncHandler(async (req, res) => {
  const { action, product, startDate, endDate } = req.query;
  const filter = {};
  if (action && action !== "All") filter.action = action;
  if (product) filter.product = product;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const history = await StockHistory.find(filter)
    .populate("product", "name sku")
    .populate("user", "name")
    .sort({ createdAt: -1 });

  res.json(history);
});

module.exports = { getHistory };
