const express = require("express");
const router = express.Router();
const { createReturn, getReturns } = require("../controllers/returnController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/")
  .get(protect, getReturns)
  .post(protect, authorize("Admin", "Store Manager"), createReturn);

module.exports = router;
