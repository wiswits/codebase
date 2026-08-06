const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Vendor = require("../models/Vendor");
const StockHistory = require("../models/StockHistory");
const IssuedItem = require("../models/IssuedItem");
const Purchase = require("../models/Purchase");

// @desc  Aggregate dashboard stats + charts data
// @route GET /api/dashboard
const getDashboardData = asyncHandler(async (req, res) => {
  const products = await Product.find().populate("category", "name");

  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + p.quantity * p.purchasePrice, 0);
  const totalStockQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockItems = products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock);
  const outOfStockItems = products.filter((p) => p.quantity <= 0);

  const totalCategories = await Category.countDocuments();
  const totalVendors = await Vendor.countDocuments();

  // Top categories by product count
  const categoryCounts = {};
  products.forEach((p) => {
    const catName = p.category?.name || "Uncategorized";
    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count, percentage: Math.round((count / totalProducts) * 100) || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Stock quantity by category (for bar chart)
  const stockByCategory = {};
  products.forEach((p) => {
    const catName = p.category?.name || "Uncategorized";
    stockByCategory[catName] = (stockByCategory[catName] || 0) + p.quantity;
  });
  const stockByCategoryChart = Object.entries(stockByCategory).map(([name, quantity]) => ({ name, quantity }));

  // Recent transactions
  const recentHistory = await StockHistory.find()
    .populate("product", "name")
    .sort({ createdAt: -1 })
    .limit(6);

  // Stock overview - last 12 months net stock movement
  const monthlyData = await StockHistory.aggregate([
    {
      $group: {
        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
        totalIn: {
          $sum: {
            $cond: [{ $in: ["$action", ["Purchase", "Stock In", "Return"]] }, "$quantity", 0],
          },
        },
        totalOut: {
          $sum: {
            $cond: [{ $eq: ["$action", "Stock Out"] }, "$quantity", 0],
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    { $limit: 12 },
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const stockOverview = monthlyData.map((m) => ({
    month: monthNames[m._id.month - 1],
    net: m.totalIn - m.totalOut,
  }));

  res.json({
    totalProducts,
    totalStockValue,
    totalStockQuantity,
    totalCategories,
    totalVendors,
    lowStockCount: lowStockItems.length,
    outOfStockCount: outOfStockItems.length,
    lowStockAlerts: lowStockItems.slice(0, 5),
    topCategories,
    stockByCategoryChart,
    recentTransactions: recentHistory,
    stockOverview,
  });
});

module.exports = { getDashboardData };
