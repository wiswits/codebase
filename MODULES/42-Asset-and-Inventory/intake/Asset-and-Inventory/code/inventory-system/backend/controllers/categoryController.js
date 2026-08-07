const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");
const Product = require("../models/Product");

const getCategories = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = search ? { name: { $regex: search, $options: "i" } } : {};
  const categories = await Category.find(filter).sort({ name: 1 });

  const withCounts = await Promise.all(
    categories.map(async (cat) => {
      const productCount = await Product.countDocuments({ category: cat._id });
      return { ...cat.toObject(), productCount };
    })
  );

  res.json(withCounts);
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json(category);
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.create({ name, description });
  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  category.name = req.body.name ?? category.name;
  category.description = req.body.description ?? category.description;
  const updated = await category.save();
  res.json(updated);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  const inUse = await Product.countDocuments({ category: category._id });
  if (inUse > 0) {
    res.status(400);
    throw new Error("Cannot delete category that has products assigned to it");
  }
  await category.deleteOne();
  res.json({ message: "Category removed" });
});

module.exports = { getCategories, getCategory, createCategory, updateCategory, deleteCategory };
