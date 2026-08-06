const getMonthly = async (filters) => {
  return {
    month: filters.month || 'July',
    year: filters.year || 2026,
    totalEmployees: 50,
    avgUtilization: 78.5,
    totalAllocations: 45
  };
};

const getTeam = async (filters) => {
  return {
    teamId: filters.teamId || 1,
    teamName: 'Engineering',
    members: 15,
    avgUtilization: 82.3
  };
};

const getDepartment = async (filters) => {
  return {
    departmentId: filters.departmentId || 1,
    departmentName: 'Engineering',
    employees: 20,
    avgUtilization: 80.5
  };
};

const findAll = async (filters) => {
  const { type, page = 1, limit = 10, orgId } = filters;
  const items = [
    { id: 1, type: 'Monthly', name: 'July 2026 Report', generatedAt: new Date().toISOString() },
    { id: 2, type: 'Team', name: 'Engineering Team Report', generatedAt: new Date().toISOString() }
  ];
  const total = items.length;
  const start = (page - 1) * limit;
  const paginated = items.slice(start, start + limit);
  return { items: paginated, total };
};

module.exports = { findAll, getMonthly, getTeam, getDepartment };