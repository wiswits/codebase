const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const Purchase = require("../models/Purchase");
const IssuedItem = require("../models/IssuedItem");
const Return = require("../models/Return");
const Vendor = require("../models/Vendor");

const parseDateRange = (req) => {
  const { startDate, endDate } = req.query;
  const range = {};
  if (startDate || endDate) {
    range.$gte = startDate ? new Date(startDate) : new Date(0);
    range.$lte = endDate ? new Date(endDate) : new Date();
  }
  return range;
};

// @desc Stock report - current snapshot of all products
const getStockReport = asyncHandler(async (req, res) => {
  const products = await Product.find().populate("category", "name");
  res.json(products);
});

// @desc Purchase report within date range
const getPurchaseReport = asyncHandler(async (req, res) => {
  const range = parseDateRange(req);
  const filter = Object.keys(range).length ? { purchaseDate: range } : {};
  const purchases = await Purchase.find(filter)
    .populate("vendor", "companyName")
    .populate("items.product", "name sku")
    .sort({ purchaseDate: -1 });
  res.json(purchases);
});

// @desc Issue report within date range
const getIssueReport = asyncHandler(async (req, res) => {
  const range = parseDateRange(req);
  const filter = Object.keys(range).length ? { issueDate: range } : {};
  const issues = await IssuedItem.find(filter).populate("items.product", "name sku").sort({ issueDate: -1 });
  res.json(issues);
});

// @desc Return report within date range
const getReturnReport = asyncHandler(async (req, res) => {
  const range = parseDateRange(req);
  const filter = Object.keys(range).length ? { returnDate: range } : {};
  const returns = await Return.find(filter).populate("product", "name sku").sort({ returnDate: -1 });
  res.json(returns);
});

// @desc Vendor report - vendors with total purchase amounts
const getVendorReport = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find();
  const report = await Promise.all(
    vendors.map(async (vendor) => {
      const purchases = await Purchase.find({ vendor: vendor._id });
      const totalSpent = purchases.reduce((sum, p) => sum + p.grandTotal, 0);
      return {
        vendor: { _id: vendor._id, companyName: vendor.companyName, contactPerson: vendor.contactPerson },
        totalPurchases: purchases.length,
        totalSpent,
      };
    })
  );
  res.json(report);
});

// @desc Summary numbers for the reports page header cards
const getReportSummary = asyncHandler(async (req, res) => {
  const products = await Product.find();
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalStockValue = products.reduce((sum, p) => sum + p.quantity * p.purchasePrice, 0);
  const lowStockItems = products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock).length;

  res.json({ totalProducts, totalStock, totalStockValue, lowStockItems });
});

module.exports = {
  getStockReport,
  getPurchaseReport,
  getIssueReport,
  getReturnReport,
  getVendorReport,
  getReportSummary,
};
