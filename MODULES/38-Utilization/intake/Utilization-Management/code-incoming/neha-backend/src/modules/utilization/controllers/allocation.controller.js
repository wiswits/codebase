const allocationService = require('../services/allocation.service');

const getAll = async (req, res) => {
  try {
    const { employeeId, projectId, status, page = 1, limit = 10 } = req.query;
    const orgId = 1;
    const result = await allocationService.getAll({
      employeeId,
      projectId,
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
    const allocation = await allocationService.getById(id, orgId);
    if (!allocation) return res.status(404).json({ success: false, message: 'Allocation not found' });
    res.status(200).json({ success: true, data: allocation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const data = req.body;
    const orgId = 1;
    const allocation = await allocationService.create({ ...data, orgId });
    res.status(201).json({ success: true, message: 'Allocation created', data: allocation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const orgId = 1;
    const updated = await allocationService.update(id, data, orgId);
    if (!updated) return res.status(404).json({ success: false, message: 'Allocation not found' });
    res.status(200).json({ success: true, message: 'Allocation updated', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = 1;
    const deleted = await allocationService.remove(id, orgId);
    if (!deleted) return res.status(404).json({ success: false, message: 'Allocation not found' });
    res.status(200).json({ success: true, message: 'Allocation deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };