const express = require("express");

const router = express.Router();

const controller = require("../controllers/review.controller");

router.get(
    "/reviews",
    controller.getAllReviews
);

router.get(
    "/reviews/:id",
    controller.getReviewById
);

router.get(
    "/reviews/employee/:employeeId/cycle/:cycleId",
    controller.getEmployeeReviews
);

router.post(
    "/reviews",
    controller.createReview
);

router.put(
    "/reviews/:id",
    controller.updateReview
);

router.delete(
    "/reviews/:id",
    controller.deleteReview
);

module.exports = router;