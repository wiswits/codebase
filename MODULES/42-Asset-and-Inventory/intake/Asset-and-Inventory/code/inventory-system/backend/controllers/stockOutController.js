const asyncHandler = require("express-async-handler");
const IssuedItem = require("../models/IssuedItem");
const Product = require("../models/Product");
const StockHistory = require("../models/StockHistory");
const { checkStockAndNotify } = require("../utils/notify");

// @desc  Issue items to employee/department - decreases stock automatically
// @route POST /api/stock-out
const issueItems = asyncHandler(async (req, res) => {
  const { issueTo, department, issueDate, items } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("Issue must include at least one item");
  }

  const processedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.product}`);
    }
    if (product.quantity < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}`);
    }

    product.quantity -= Number(item.quantity);
    await product.save();
    await checkStockAndNotify(product);

    processedItems.push({
      product: product._id,
      quantity: item.quantity,
      remarks: item.remarks || "",
    });

    await StockHistory.create({
      product: product._id,
      user: req.user?._id,
      action: "Stock Out",
      quantity: item.quantity,
      note: `Issued to ${issueTo} (${department})`,
    });
  }

  const issuedItem = await IssuedItem.create({
    issueTo,
    department,
    issueDate: issueDate || Date.now(),
    items: processedItems,
    createdBy: req.user?._id,
  });

  const populated = await issuedItem.populate("items.product", "name sku quantity");
  res.status(201).json(populated);
});

const getIssuedItems = asyncHandler(async (req, res) => {
  const records = await IssuedItem.find()
    .populate("items.product", "name sku")
    .populate("createdBy", "name")
    .sort({ issueDate: -1 });
  res.json(records);
});

const getIssuedItem = asyncHandler(async (req, res) => {
  const record = await IssuedItem.findById(req.params.id).populate("items.product", "name sku quantity");
  if (!record) {
    res.status(404);
    throw new Error("Issued record not found");
  }
  res.json(record);
});

module.exports = { issueItems, getIssuedItems, getIssuedItem };
