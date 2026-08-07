const express = require("express");
const router = express.Router();
const { demoUsers } = require("../controllers/userController");

// No auth required here - this is what lets the frontend log in as a demo user.
router.get("/demo-users", demoUsers);

module.exports = router;
