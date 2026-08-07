let benches = [];
let idCounter = 1;

const seed = () => {
  benches = [
    { id: idCounter++, orgId: 1, employeeId: 4, employeeName: 'Sneha Reddy', department: 'Engineering', benchDuration: 15, benchReason: 'Project completed', availableDate: '2026-08-15', suggestedAllocation: 'New project' },
    { id: idCounter++, orgId: 1, employeeId: 5, employeeName: 'Rahul Kumar', department: 'Marketing', benchDuration: 5, benchReason: 'Between projects', availableDate: '2026-08-01', suggestedAllocation: 'Marketing campaign' }
  ];
};

seed();

const findAll = async (filters) => {
  const { status, page = 1, limit = 10, orgId } = filters;
  let filtered = benches.filter(b => b.orgId === orgId);
  if (status) filtered = filtered.filter(b => b.status === status);
  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  return { items: paginated, total };
};

const findById = async (id, orgId) => {
  return benches.find(b => b.id === parseInt(id) && b.orgId === orgId) || null;
};

module.exports = { findAll, findById };