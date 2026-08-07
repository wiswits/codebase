const express = require("express");
const router = express.Router();
const {
  getStockReport,
  getPurchaseReport,
  getIssueReport,
  getReturnReport,
  getVendorReport,
  getReportSummary,
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

router.get("/summary", protect, getReportSummary);
router.get("/stock", protect, getStockReport);
router.get("/purchases", protect, getPurchaseReport);
router.get("/issues", protect, getIssueReport);
router.get("/returns", protect, getReturnReport);
router.get("/vendors", protect, getVendorReport);

module.exports = router;
