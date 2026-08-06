const asyncHandler = require("../../../middleware/asyncHandler");
const ApiResponse = require("../../../utils/ApiResponse");

const service = require("../services/summary.service");

const getDashboardSummary = asyncHandler(async (req, res) => {

    const data = await service.getDashboardSummary(
        Number(req.query.org_id)||1,
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Dashboard summary fetched successfully.",
            data
        )
    );

});

const getCycleSummary = asyncHandler(async (req, res) => {

    const data = await service.getCycleSummary(
        Number(req.params.cycleId),
        Number(req.query.org_id)||1,
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Cycle summary fetched successfully.",
            data
        )
    );

});

const getEmployeeSummary = asyncHandler(async (req, res) => {

    const data = await service.getEmployeeSummary(
        Number(req.params.employeeId),
        Number(req.params.cycleId),
        Number(req.query.org_id)||1,
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Employee summary fetched successfully.",
            data
        )
    );

});

module.exports = {
    getDashboardSummary,
    getCycleSummary,
    getEmployeeSummary
};