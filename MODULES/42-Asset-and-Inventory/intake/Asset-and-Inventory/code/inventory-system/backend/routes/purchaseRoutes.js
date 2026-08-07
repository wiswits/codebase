const express = require("express");
const router = express.Router();
const { createPurchase, getPurchases, getPurchase } = require("../controllers/purchaseController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/")
  .get(protect, getPurchases)
  .post(protect, authorize("Admin", "Store Manager"), createPurchase);

router.get("/:id", protect, getPurchase);

module.exports = router;
