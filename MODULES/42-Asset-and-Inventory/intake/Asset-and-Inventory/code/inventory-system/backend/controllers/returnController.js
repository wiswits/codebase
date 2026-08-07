const asyncHandler = require("express-async-handler");
const Return = require("../models/Return");
const Product = require("../models/Product");
const IssuedItem = require("../models/IssuedItem");
const StockHistory = require("../models/StockHistory");

// @desc  Return issued items - increases stock automatically
// @route POST /api/returns
const createReturn = asyncHandler(async (req, res) => {
  const { issuedItem, product, quantity, condition, returnDate, remarks } = req.body;

  const productDoc = await Product.findById(product);
  if (!productDoc) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Only add back to sellable stock if item returned in good condition
  if (condition !== "Damaged") {
    productDoc.quantity += Number(quantity);
    await productDoc.save();
  }

  await StockHistory.create({
    product: productDoc._id,
    user: req.user?._id,
    action: "Return",
    quantity,
    note: `Returned (${condition})${remarks ? " - " + remarks : ""}`,
  });

  const returnRecord = await Return.create({
    issuedItem,
    product,
    quantity,
    condition,
    returnDate: returnDate || Date.now(),
    remarks,
    createdBy: req.user?._id,
  });

  if (issuedItem) {
    await IssuedItem.findByIdAndUpdate(issuedItem, { status: "Returned" });
  }

  const populated = await returnRecord.populate("product", "name sku");
  res.status(201).json(populated);
});

const getReturns = asyncHandler(async (req, res) => {
  const returns = await Return.find()
    .populate("product", "name sku")
    .populate("createdBy", "name")
    .sort({ returnDate: -1 });
  res.json(returns);
});

module.exports = { createReturn, getReturns };
