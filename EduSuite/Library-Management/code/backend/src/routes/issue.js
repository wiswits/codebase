const express = require("express");
const router = express.Router();
const { attachUser } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const { listRegister, issueBook, returnBook } = require("../controllers/issueController");

router.use(attachUser);

router.get("/", requireRole("admin", "teacher"), listRegister);
router.post("/issue", requireRole("admin", "teacher"), issueBook);
router.post("/:id/return", requireRole("admin", "teacher"), returnBook);

module.exports = router;
