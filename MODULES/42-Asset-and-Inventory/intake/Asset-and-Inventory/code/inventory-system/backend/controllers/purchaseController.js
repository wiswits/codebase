const asyncHandler = require("express-async-handler");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const StockHistory = require("../models/StockHistory");

// @desc  Create purchase - increases product stock automatically
// @route POST /api/purchases
const createPurchase = asyncHandler(async (req, res) => {
  const { vendor, invoiceNumber, purchaseDate, items } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("Purchase must include at least one item");
  }

  let grandTotal = 0;
  const processedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.product}`);
    }
    const total = item.quantity * item.unitPrice;
    grandTotal += total;
    processedItems.push({
      product: product._id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total,
    });

    // increase stock
    product.quantity += Number(item.quantity);
    await product.save();

    await StockHistory.create({
      product: product._id,
      user: req.user?._id,
      action: "Purchase",
      quantity: item.quantity,
      note: `Purchased via invoice ${invoiceNumber}`,
    });
  }

  const purchase = await Purchase.create({
    vendor,
    invoiceNumber,
    purchaseDate: purchaseDate || Date.now(),
    items: processedItems,
    grandTotal,
    createdBy: req.user?._id,
  });

  const populated = await purchase.populate([
    { path: "vendor", select: "companyName" },
    { path: "items.product", select: "name sku" },
  ]);

  res.status(201).json(populated);
});

const getPurchases = asyncHandler(async (req, res) => {
  const purchases = await Purchase.find()
    .populate("vendor", "companyName")
    .populate("items.product", "name sku")
    .sort({ purchaseDate: -1 });
  res.json(purchases);
});

const getPurchase = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id)
    .populate("vendor", "companyName")
    .populate("items.product", "name sku");
  if (!purchase) {
    res.status(404);
    throw new Error("Purchase not found");
  }
  res.json(purchase);
});

module.exports = { createPurchase, getPurchases, getPurchase };
