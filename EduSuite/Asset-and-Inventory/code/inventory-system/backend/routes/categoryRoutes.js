const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/")
  .get(protect, getCategories)
  .post(protect, authorize("Admin", "Store Manager"), createCategory);

router.route("/:id")
  .get(protect, getCategory)
  .put(protect, authorize("Admin", "Store Manager"), updateCategory)
  .delete(protect, authorize("Admin"), deleteCategory);

module.exports = router;
