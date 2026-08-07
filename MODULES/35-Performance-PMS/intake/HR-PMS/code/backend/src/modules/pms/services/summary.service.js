const repository = require("../repositories/summary.repository");

const getDashboardSummary = async (orgId) => {

    return await repository.getDashboardSummary(
        orgId
    );

};

const getCycleSummary = async (
    cycleId,
    orgId
) => {

    return await repository.getCycleSummary(
        cycleId,
        orgId
    );

};

const getEmployeeSummary = async (
    employeeId,
    cycleId,
    orgId
) => {

    return await repository.getEmployeeSummary(
        employeeId,
        cycleId,
        orgId
    );

};

module.exports = {
    getDashboardSummary,
    getCycleSummary,
    getEmployeeSummary
};