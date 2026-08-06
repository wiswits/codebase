const express = require("express");

const router = express.Router();

const controller = require("../controllers/summary.controller");

router.get(
    "/summary/dashboard",
    controller.getDashboardSummary
);

router.get(
    "/summary/cycle/:cycleId",
    controller.getCycleSummary
);

router.get(
    "/summary/employee/:employeeId/cycle/:cycleId",
    controller.getEmployeeSummary
);

module.exports = router;