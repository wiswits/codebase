const repository = require("../repositories/cycle.repository");
const ApiError = require("../../../utils/ApiError");

const getAllCycles = async (orgId) => {
    return await repository.getAllCycles(orgId);
};

const getCycleById = async (id, orgId) => {
    const cycle = await repository.getCycleById(id, orgId);

    if (!cycle) {
        throw new ApiError(404, "Appraisal cycle not found.");
    }

    return cycle;
};

const createCycle = async (cycleData) => {
    const existingCycles = await repository.getAllCycles(cycleData.org_id);

    const duplicate = existingCycles.find(
        (cycle) => cycle.cycle_code === cycleData.cycle_code
    );

    if (duplicate) {
        throw new ApiError(409, "Cycle code already exists.");
    }

    const cycleId = await repository.createCycle(cycleData);

    return await repository.getCycleById(cycleId, cycleData.org_id);
};

const updateCycle = async (id, orgId, cycleData) => {
    const cycle = await repository.getCycleById(id, orgId);

    if (!cycle) {
        throw new ApiError(404, "Appraisal cycle not found.");
    }

    await repository.updateCycle(id, orgId, cycleData);

    return await repository.getCycleById(id, orgId);
};

const deleteCycle = async (id, orgId) => {
    const cycle = await repository.getCycleById(id, orgId);

    if (!cycle) {
        throw new ApiError(404, "Appraisal cycle not found.");
    }

    await repository.deleteCycle(id, orgId);

    return {
        message: "Appraisal cycle deleted successfully."
    };
};

module.exports = {
    getAllCycles,
    getCycleById,
    createCycle,
    updateCycle,
    deleteCycle
};