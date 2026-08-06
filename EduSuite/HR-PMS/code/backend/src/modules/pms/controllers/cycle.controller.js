const asyncHandler = require("../../../middleware/asyncHandler");
const ApiResponse = require("../../../utils/ApiResponse");

const service = require("../services/cycle.service");   

const getAllCycles = asyncHandler(async (req, res) => {

    const orgId = Number(req.query.org_id) ||1;

    const cycles = await service.getAllCycles(orgId);

    res.status(200).json(
        new ApiResponse(
            200,
            "Appraisal cycles fetched successfully.",
            cycles
        )
    );

});

const getCycleById = asyncHandler(async (req, res) => {

    const id = Number(req.params.id);

    const orgId = Number(req.query.org_id) ||1;

    const cycle = await service.getCycleById(id, orgId);

    res.status(200).json(
        new ApiResponse(
            200,
            "Appraisal cycle fetched successfully.",
            cycle
        )
    );

});

const createCycle = asyncHandler(async (req, res) => {

    const cycle = await service.createCycle(req.body);

    res.status(201).json(
        new ApiResponse(
            201,
            "Appraisal cycle created successfully.",
            cycle
        )
    );

});

const updateCycle = asyncHandler(async (req, res) => {

    const id = Number(req.params.id);

    const orgId = Number(req.body.org_id) ||1;

    const cycle = await service.updateCycle(
        id,
        orgId,
        req.body
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Appraisal cycle updated successfully.",
            cycle
        )
    );

});

const deleteCycle = asyncHandler(async (req, res) => {

    const id = Number(req.params.id);

    const orgId = Number(req.query.org_id) ||1;

    const result = await service.deleteCycle(id, orgId);

    res.status(200).json(
        new ApiResponse(
            200,
            result.message
        )
    );

});

module.exports = {
    getAllCycles,
    getCycleById,
    createCycle,
    updateCycle,
    deleteCycle
};