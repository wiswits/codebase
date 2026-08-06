const getOverview = async (orgId) => {
  return {
    totalEmployees: 50,
    avgUtilization: 78.5,
    totalDepartments: 6,
    activeProjects: 12
  };
};

const getTrends = async (filters) => {
  return {
    period: filters.period || 'monthly',
    data: [
      { month: 'Jan', utilization: 72 },
      { month: 'Feb', utilization: 75 },
      { month: 'Mar', utilization: 78 },
      { month: 'Apr', utilization: 80 },
      { month: 'May', utilization: 76 },
      { month: 'Jun', utilization: 79 }
    ]
  };
};

module.exports = { getOverview, getTrends };