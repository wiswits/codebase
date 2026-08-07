const employeeService = require('../services/employee.service');

const getAll = async (req, res) => {
  try {
    const { search, department, status, page = 1, limit = 10 } = req.query;
    const orgId = 1;
    const result = await employeeService.getAll({
      search,
      department,
      status,
      page: parseInt(page),
      limit: parseInt(limit),
      orgId
    });
    res.status(200).json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = 1;
    const employee = await employeeService.getById(id, orgId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const data = req.body;
    const orgId = 1;
    const employee = await employeeService.create({ ...data, orgId });
    res.status(201).json({ success: true, message: 'Employee created', data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const orgId = 1;
    const updated = await employeeService.update(id, data, orgId);
    if (!updated) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.status(200).json({ success: true, message: 'Employee updated', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = 1;
    const deleted = await employeeService.remove(id, orgId);
    if (!deleted) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.status(200).json({ success: true, message: 'Employee deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };