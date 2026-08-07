const asyncHandler = require("../../../middleware/asyncHandler");
const ApiResponse = require("../../../utils/ApiResponse");

const service = require("../services/goal.service");

const getAllGoals = asyncHandler(async (req, res) => {

    const data = await service.getAllGoals(
        Number(req.query.org_id) || 1,
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Goals fetched successfully.",
            data
        )
    );

});

const getGoalById = asyncHandler(async (req, res) => {

    const data = await service.getGoalById(
        Number(req.params.id),
        Number(req.query.org_id) || 1,
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Goal fetched successfully.",
            data
        )
    );

});

const createGoal = asyncHandler(async (req, res) => {

    const data = await service.createGoal(req.body);

    res.status(201).json(
        new ApiResponse(
            201,
            "Goal created successfully.",
            data
        )
    );

});

const updateGoal = asyncHandler(async (req, res) => {

    const data = await service.updateGoal(
        Number(req.params.id),
        Number(req.body.org_id) || 1,
        req.body
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Goal updated successfully.",
            data
        )
    );

});

const deleteGoal = asyncHandler(async (req, res) => {

    const data = await service.deleteGoal(
        Number(req.params.id),
        Number(req.query.org_id) ||1,
    );

    res.status(200).json(
        new ApiResponse(
            200,
            data.message
        )
    );

});

module.exports = {
    getAllGoals,
    getGoalById,
    createGoal,
    updateGoal,
    deleteGoal
};