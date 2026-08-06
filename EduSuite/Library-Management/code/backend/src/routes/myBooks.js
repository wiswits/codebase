const express = require("express");
const router = express.Router();
const { attachUser } = require("../middleware/auth");
const { myBooks } = require("../controllers/myBooksController");

router.use(attachUser);

router.get("/", myBooks);

module.exports = router;
