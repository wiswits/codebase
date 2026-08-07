const express = require("express");
const router = express.Router();
const { stockIn, getStockInHistory } = require("../controllers/stockInController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/")
  .get(protect, getStockInHistory)
  .post(protect, authorize("Admin", "Store Manager"), stockIn);

module.exports = router;
