const reportRepository = require('../repositories/report.repository');

const getAll = async (filters) => {
  const { type, page, limit, orgId } = filters;
  const { items, total } = await reportRepository.findAll({ type, page, limit, orgId });
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getMonthly = async (filters) => {
  return await reportRepository.getMonthly(filters);
};

const getTeam = async (filters) => {
  return await reportRepository.getTeam(filters);
};

const getDepartment = async (filters) => {
  return await reportRepository.getDepartment(filters);
};

module.exports = { getAll, getMonthly, getTeam, getDepartment };