const analyticsService = require('../services/analytics.service');

const getOverview = async (req, res) => {
  try {
    const orgId = 1;
    const data = await analyticsService.getOverview(orgId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTrends = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const orgId = 1;
    const data = await analyticsService.getTrends({ period, orgId });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getOverview, getTrends };