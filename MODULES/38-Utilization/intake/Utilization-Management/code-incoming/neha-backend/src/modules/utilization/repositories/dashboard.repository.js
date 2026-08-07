const getDashboard = async (orgId) => {
  return {
    totalEmployees: 50,
    activeEmployees: 42,
    benchEmployees: 8,
    activeProjects: 12,
    utilizationRate: 78.5,
    availableCapacity: 320,
    allocatedCapacity: 280,
    overUtilized: 5,
    underUtilized: 10
  };
};

const getSummary = async (orgId) => {
  return {
    departmentCount: 6,
    totalAllocations: 45,
    monthlyUtilization: [72, 75, 78, 80, 76, 79]
  };
};

module.exports = { getDashboard, getSummary };