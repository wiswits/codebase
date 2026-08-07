const express = require("express");

const router = express.Router();

router.use(require("../modules/pms/routes/pms.routes"));
router.use(require("../modules/pms/routes/goal.routes"));
router.use(require("../modules/pms/routes/review.routes"));
router.use(require("../modules/pms/routes/summary.routes"));

module.exports = router;