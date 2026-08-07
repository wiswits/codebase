const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} = require("../controllers/productController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/")
  .get(protect, getProducts)
  .post(protect, authorize("Admin", "Store Manager"), createProduct);

router.get("/low-stock", protect, getLowStockProducts);

router.route("/:id")
  .get(protect, getProduct)
  .put(protect, authorize("Admin", "Store Manager"), updateProduct)
  .delete(protect, authorize("Admin"), deleteProduct);

module.exports = router;
