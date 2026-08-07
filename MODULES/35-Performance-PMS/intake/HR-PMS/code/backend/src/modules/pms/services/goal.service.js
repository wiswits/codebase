const repository = require("../repositories/goal.repository");
const ApiError = require("../../../utils/ApiError");

const getAllGoals = async (orgId) => {
    return await repository.getAllGoals(orgId);
};

const getGoalById = async (id, orgId) => {

    const goal = await repository.getGoalById(id, orgId);

    if (!goal) {
        throw new ApiError(404, "Goal not found.");
    }

    return goal;
};

const createGoal = async (goalData) => {

    const id = await repository.createGoal(goalData);

    return await repository.getGoalById(
        id,
        goalData.org_id
    );
};

const updateGoal = async (id, orgId, goalData) => {

    const goal = await repository.getGoalById(id, orgId);

    if (!goal) {
        throw new ApiError(404, "Goal not found.");
    }

    await repository.updateGoal(id, orgId, goalData);

    return await repository.getGoalById(id, orgId);
};

const deleteGoal = async (id, orgId) => {

    const goal = await repository.getGoalById(id, orgId);

    if (!goal) {
        throw new ApiError(404, "Goal not found.");
    }

    await repository.deleteGoal(id, orgId);

    return {
        message: "Goal deleted successfully."
    };
};

module.exports = {
    getAllGoals,
    getGoalById,
    createGoal,
    updateGoal,
    deleteGoal
};