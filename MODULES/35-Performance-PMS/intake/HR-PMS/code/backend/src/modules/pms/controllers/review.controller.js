const asyncHandler = require("../../../middleware/asyncHandler");
const ApiResponse = require("../../../utils/ApiResponse");

const service = require("../services/review.service");

const getAllReviews = asyncHandler(async (req, res) => {

    const data = await service.getAllReviews(
        Number(req.query.org_id)||1,
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Reviews fetched successfully.",
            data
        )
    );

});

const getReviewById = asyncHandler(async (req, res) => {

    const data = await service.getReviewById(
        Number(req.params.id),
        Number(req.query.org_id)||1,
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Review fetched successfully.",
            data
        )
    );

});

const getEmployeeReviews = asyncHandler(async (req, res) => {

    const data = await service.getEmployeeReviews(
        Number(req.params.employeeId),
        Number(req.params.cycleId),
        Number(req.query.org_id) ||1,
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Employee reviews fetched successfully.",
            data
        )
    );

});

const createReview = asyncHandler(async (req, res) => {

    const data = await service.createReview(req.body);

    res.status(201).json(
        new ApiResponse(
            201,
            "Review created successfully.",
            data
        )
    );

});

const updateReview = asyncHandler(async (req, res) => {

    const data = await service.updateReview(
        Number(req.params.id),
        Number(req.body.org_id)||1,
        req.body
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Review updated successfully.",
            data
        )
    );

});

const deleteReview = asyncHandler(async (req, res) => {

    const data = await service.deleteReview(
        Number(req.params.id),
        Number(req.query.org_id)||1,
    );

    res.status(200).json(
        new ApiResponse(
            200,
            data.message
        )
    );

});

module.exports = {
    getAllReviews,
    getReviewById,
    getEmployeeReviews,
    createReview,
    updateReview,
    deleteReview
};