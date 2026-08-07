const employeeRepository = require('../repositories/employee.repository');

const getAll = async (filters) => {
  const { search, department, status, page, limit, orgId } = filters;
  const { items, total } = await employeeRepository.findAll({ search, department, status, page, limit, orgId });
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getById = async (id, orgId) => {
  return await employeeRepository.findById(id, orgId);
};

const create = async (data) => {
  return await employeeRepository.create(data);
};

const update = async (id, data, orgId) => {
  return await employeeRepository.update(id, data, orgId);
};

const remove = async (id, orgId) => {
  return await employeeRepository.remove(id, orgId);
};

module.exports = { getAll, getById, create, update, remove };