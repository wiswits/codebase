const benchService = require('../services/bench.service');

const getAll = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const orgId = 1;
    const result = await benchService.getAll({
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
    const bench = await benchService.getById(id, orgId);
    if (!bench) return res.status(404).json({ success: false, message: 'Bench record not found' });
    res.status(200).json({ success: true, data: bench });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getById };