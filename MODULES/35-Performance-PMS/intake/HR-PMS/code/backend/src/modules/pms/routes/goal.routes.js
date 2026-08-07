const express = require("express");

const router = express.Router();

const controller = require("../controllers/goal.controller");

router.get(
    "/goals",
    controller.getAllGoals
);

router.get(
    "/goals/:id",
    controller.getGoalById
);

router.post(
    "/goals",
    controller.createGoal
);

router.put(
    "/goals/:id",
    controller.updateGoal
);

router.delete(
    "/goals/:id",
    controller.deleteGoal
);

module.exports = router;