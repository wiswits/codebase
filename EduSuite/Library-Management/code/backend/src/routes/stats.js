const express = require("express");
const router = express.Router();
const { attachUser } = require("../middleware/auth");
const {
  summary,
  mostIssued,
  categoryBreakdown,
  copyAvailability,
  issueReturnTrend,
} = require("../controllers/statsController");

router.use(attachUser);

router.get("/summary", summary);
router.get("/most-issued", mostIssued);
router.get("/category-breakdown", categoryBreakdown);
router.get("/copy-availability", copyAvailability);
router.get("/issue-return-trend", issueReturnTrend);

module.exports = router;
