const analyticsRepository = require('../repositories/analytics.repository');

const getOverview = async (orgId) => {
  return await analyticsRepository.getOverview(orgId);
};

const getTrends = async (filters) => {
  return await analyticsRepository.getTrends(filters);
};

module.exports = { getOverview, getTrends };