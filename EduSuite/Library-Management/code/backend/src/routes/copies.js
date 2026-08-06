const express = require("express");
const router = express.Router();
const { attachUser } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const { listCopies, addCopy, updateCopyStatus, deleteCopy } = require("../controllers/copyController");

router.use(attachUser);

router.get("/", listCopies);
router.post("/", requireRole("admin", "teacher"), addCopy);
router.patch("/:id/status", requireRole("admin", "teacher"), updateCopyStatus);
router.delete("/:id", requireRole("admin"), deleteCopy);

module.exports = router;
