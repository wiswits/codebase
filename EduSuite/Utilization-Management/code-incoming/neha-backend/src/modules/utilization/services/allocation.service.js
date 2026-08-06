const allocationRepository = require('../repositories/allocation.repository');

const getAll = async (filters) => {
  const { employeeId, projectId, status, page, limit, orgId } = filters;
  const { items, total } = await allocationRepository.findAll({ employeeId, projectId, status, page, limit, orgId });
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getById = async (id, orgId) => {
  return await allocationRepository.findById(id, orgId);
};

const create = async (data) => {
  return await allocationRepository.create(data);
};

const update = async (id, data, orgId) => {
  return await allocationRepository.update(id, data, orgId);
};

const remove = async (id, orgId) => {
  return await allocationRepository.remove(id, orgId);
};

module.exports = { getAll, getById, create, update, remove };