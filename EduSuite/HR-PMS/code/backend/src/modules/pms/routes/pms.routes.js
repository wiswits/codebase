const express = require("express");

const router = express.Router();

const controller = require("../controllers/cycle.controller");

const {
    createCycleValidator,
    updateCycleValidator,
    deleteCycleValidator
} = require("../validators/pms.validator");

router.get(
    "/cycles",
    controller.getAllCycles
);

router.get(
    "/cycles/:id",
    controller.getCycleById
);

router.post(
    "/cycles",
    createCycleValidator,
    controller.createCycle
);

router.put(
    "/cycles/:id",
    updateCycleValidator,
    controller.updateCycle
);

router.delete(
    "/cycles/:id",
    deleteCycleValidator,
    controller.deleteCycle
);

module.exports = router;