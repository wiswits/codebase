const express = require("express");
const router = express.Router();
const { getUsers, getUser, createUser, updateUser, deleteUser } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/")
  .get(protect, authorize("Admin"), getUsers)
  .post(protect, authorize("Admin"), createUser);

router.route("/:id")
  .get(protect, authorize("Admin"), getUser)
  .put(protect, updateUser)
  .delete(protect, authorize("Admin"), deleteUser);

module.exports = router;
