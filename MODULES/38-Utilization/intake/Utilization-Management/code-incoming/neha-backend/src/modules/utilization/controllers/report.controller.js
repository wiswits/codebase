const reportService = require('../services/report.service');

const getAll = async (req, res) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    const orgId = 1;
    const result = await reportService.getAll({
      type,
      page: parseInt(page),
      limit: parseInt(limit),
      orgId
    });
    res.status(200).json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMonthly = async (req, res) => {
  try {
    const { month, year } = req.query;
    const orgId = 1;
    const data = await reportService.getMonthly({ month, year, orgId });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTeam = async (req, res) => {
  try {
    const { teamId } = req.query;
    const orgId = 1;
    const data = await reportService.getTeam({ teamId, orgId });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDepartment = async (req, res) => {
  try {
    const { departmentId } = req.query;
    const orgId = 1;
    const data = await reportService.getDepartment({ departmentId, orgId });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getMonthly, getTeam, getDepartment };