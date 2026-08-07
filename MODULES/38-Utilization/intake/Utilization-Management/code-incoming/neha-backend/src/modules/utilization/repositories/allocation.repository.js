let allocations = [];
let idCounter = 1;

const seed = () => {
  allocations = [
    { id: idCounter++, orgId: 1, employeeId: 1, projectId: 1, allocationPercent: 50, workingHours: 20, startDate: '2026-01-01', endDate: '2026-12-31', status: 'active', remarks: 'Core team' },
    { id: idCounter++, orgId: 1, employeeId: 1, projectId: 2, allocationPercent: 30, workingHours: 12, startDate: '2026-03-01', endDate: '2026-09-30', status: 'active', remarks: 'Mobile team' },
    { id: idCounter++, orgId: 1, employeeId: 2, projectId: 1, allocationPercent: 70, workingHours: 28, startDate: '2026-01-01', endDate: '2026-12-31', status: 'active', remarks: 'Product lead' }
  ];
};

seed();

const findAll = async (filters) => {
  const { employeeId, projectId, status, page = 1, limit = 10, orgId } = filters;
  let filtered = allocations.filter(a => a.orgId === orgId);
  if (employeeId) filtered = filtered.filter(a => a.employeeId === parseInt(employeeId));
  if (projectId) filtered = filtered.filter(a => a.projectId === parseInt(projectId));
  if (status) filtered = filtered.filter(a => a.status === status);
  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  return { items: paginated, total };
};

const findById = async (id, orgId) => {
  return allocations.find(a => a.id === parseInt(id) && a.orgId === orgId) || null;
};

const create = async (data) => {
  const newItem = { id: idCounter++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  allocations.push(newItem);
  return newItem;
};

const update = async (id, data, orgId) => {
  const index = allocations.findIndex(a => a.id === parseInt(id) && a.orgId === orgId);
  if (index === -1) return null;
  allocations[index] = { ...allocations[index], ...data, updatedAt: new Date().toISOString() };
  return allocations[index];
};

const remove = async (id, orgId) => {
  const index = allocations.findIndex(a => a.id === parseInt(id) && a.orgId === orgId);
  if (index === -1) return false;
  allocations.splice(index, 1);
  return true;
};

module.exports = { findAll, findById, create, update, remove };