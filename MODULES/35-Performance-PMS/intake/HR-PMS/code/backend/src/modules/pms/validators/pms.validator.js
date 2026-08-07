const { body, param, validationResult } = require("express-validator");

const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    next();
};

const createCycleValidator = [
    body("org_id")
        .isInt({ min: 1 })
        .withMessage("Organization ID is required"),

    body("cycle_name")
        .trim()
        .notEmpty()
        .withMessage("Cycle name is required"),

    body("cycle_code")
        .trim()
        .notEmpty()
        .withMessage("Cycle code is required"),

    body("start_date")
        .isDate()
        .withMessage("Valid start date is required"),

    body("end_date")
        .isDate()
        .withMessage("Valid end date is required"),

    body("created_by")
        .isInt({ min: 1 })
        .withMessage("Created By is required"),

    validate
];

const updateCycleValidator = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Valid cycle ID is required"),

    validate
];

const deleteCycleValidator = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Valid cycle ID is required"),

    validate
];

module.exports = {
    createCycleValidator,
    updateCycleValidator,
    deleteCycleValidator
};