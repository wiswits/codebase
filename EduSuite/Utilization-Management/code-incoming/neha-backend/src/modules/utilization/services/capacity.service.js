const capacityRepository = require('../repositories/capacity.repository');

const getAll = async (filters) => {
  const { department, page, limit, orgId } = filters;
  const { items, total } = await capacityRepository.findAll({ department, page, limit, orgId });
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getById = async (id, orgId) => {
  return await capacityRepository.findById(id, orgId);
};

const create = async (data) => {
  return await capacityRepository.create(data);
};

const update = async (id, data, orgId) => {
  return await capacityRepository.update(id, data, orgId);
};

module.exports = { getAll, getById, create, update };