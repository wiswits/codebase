const express = require("express");
const router = express.Router();
const { attachUser } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const { listBooks, createBook, updateBook, deleteBook } = require("../controllers/bookController");

router.use(attachUser);

router.get("/", listBooks);
router.post("/", requireRole("admin", "teacher"), createBook);
router.put("/:id", requireRole("admin", "teacher"), updateBook);
router.delete("/:id", requireRole("admin"), deleteBook);

module.exports = router;
