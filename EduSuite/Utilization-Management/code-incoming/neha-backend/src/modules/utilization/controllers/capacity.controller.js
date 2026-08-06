const capacityService = require('../services/capacity.service');

const getAll = async (req, res) => {
  try {
    const { department, page = 1, limit = 10 } = req.query;
    const orgId = 1;
    const result = await capacityService.getAll({
      department,
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
    const capacity = await capacityService.getById(id, orgId);
    if (!capacity) return res.status(404).json({ success: false, message: 'Capacity not found' });
    res.status(200).json({ success: true, data: capacity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const data = req.body;
    const orgId = 1;
    const capacity = await capacityService.create({ ...data, orgId });
    res.status(201).json({ success: true, message: 'Capacity created', data: capacity });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const orgId = 1;
    const updated = await capacityService.update(id, data, orgId);
    if (!updated) return res.status(404).json({ success: false, message: 'Capacity not found' });
    res.status(200).json({ success: true, message: 'Capacity updated', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getById, create, update };