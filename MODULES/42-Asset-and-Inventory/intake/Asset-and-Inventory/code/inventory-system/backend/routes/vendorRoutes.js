const express = require("express");
const router = express.Router();
const {
  getVendors,
  getVendor,
  getVendorPurchaseHistory,
  createVendor,
  updateVendor,
  deleteVendor,
} = require("../controllers/vendorController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/")
  .get(protect, getVendors)
  .post(protect, authorize("Admin", "Store Manager"), createVendor);

router.route("/:id")
  .get(protect, getVendor)
  .put(protect, authorize("Admin", "Store Manager"), updateVendor)
  .delete(protect, authorize("Admin"), deleteVendor);

router.get("/:id/purchases", protect, getVendorPurchaseHistory);

module.exports = router;
