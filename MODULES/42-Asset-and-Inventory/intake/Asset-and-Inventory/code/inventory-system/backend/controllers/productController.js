const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const { checkStockAndNotify } = require("../utils/notify");

// @desc  Get all products with search/filter/pagination
// @route GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const { search, category, status, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
    ];
  }
  if (category && category !== "All") filter.category = category;

  let products = await Product.find(filter)
    .populate("category", "name")
    .sort({ createdAt: -1 });

  // status filter applied after virtual is computed
  if (status && status !== "All") {
    products = products.filter((p) => p.status === status);
  }

  const total = products.length;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const start = (pageNum - 1) * limitNum;
  const paginated = products.slice(start, start + limitNum);

  res.json({
    products: paginated,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category", "name");
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json(product);
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  await checkStockAndNotify(product);
  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  Object.assign(product, req.body);
  const updated = await product.save();
  await checkStockAndNotify(updated);
  res.json(updated);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  await product.deleteOne();
  res.json({ message: "Product removed" });
});

const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().populate("category", "name");
  const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock);
  res.json(lowStock);
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
};
