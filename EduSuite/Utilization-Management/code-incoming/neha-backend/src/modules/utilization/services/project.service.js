const projectRepository = require('../repositories/project.repository');

const getAll = async (filters) => {
  const { status, search, page, limit, orgId } = filters;
  const { items, total } = await projectRepository.findAll({ status, search, page, limit, orgId });
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getById = async (id, orgId) => {
  return await projectRepository.findById(id, orgId);
};

const create = async (data) => {
  return await projectRepository.create(data);
};

const update = async (id, data, orgId) => {
  return await projectRepository.update(id, data, orgId);
};

const remove = async (id, orgId) => {
  return await projectRepository.remove(id, orgId);
};

module.exports = { getAll, getById, create, update, remove };