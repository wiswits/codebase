const benchRepository = require('../repositories/bench.repository');

const getAll = async (filters) => {
  const { status, page, limit, orgId } = filters;
  const { items, total } = await benchRepository.findAll({ status, page, limit, orgId });
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getById = async (id, orgId) => {
  return await benchRepository.findById(id, orgId);
};

module.exports = { getAll, getById };