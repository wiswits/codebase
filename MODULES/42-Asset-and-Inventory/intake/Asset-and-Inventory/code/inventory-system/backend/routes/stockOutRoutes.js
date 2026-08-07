const express = require("express");
const router = express.Router();
const { issueItems, getIssuedItems, getIssuedItem } = require("../controllers/stockOutController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/")
  .get(protect, getIssuedItems)
  .post(protect, authorize("Admin", "Store Manager"), issueItems);

router.get("/:id", protect, getIssuedItem);

module.exports = router;
