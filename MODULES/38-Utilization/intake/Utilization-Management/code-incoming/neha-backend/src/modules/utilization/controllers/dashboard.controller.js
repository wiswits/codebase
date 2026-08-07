const dashboardService = require('../services/dashboard.service');

const getDashboard = async (req, res) => {
  try {
    const orgId = 1;
    const data = await dashboardService.getDashboard(orgId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSummary = async (req, res) => {
  try {
    const orgId = 1;
    const data = await dashboardService.getSummary(orgId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard, getSummary };