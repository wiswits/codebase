const dashboardRepository = require('../repositories/dashboard.repository');

const getDashboard = async (orgId) => {
  return await dashboardRepository.getDashboard(orgId);
};

const getSummary = async (orgId) => {
  return await dashboardRepository.getSummary(orgId);
};

module.exports = { getDashboard, getSummary };