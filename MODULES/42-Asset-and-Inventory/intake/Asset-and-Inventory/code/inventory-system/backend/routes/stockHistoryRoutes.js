const express = require("express");
const router = express.Router();
const { getHistory } = require("../controllers/stockHistoryController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getHistory);

module.exports = router;
