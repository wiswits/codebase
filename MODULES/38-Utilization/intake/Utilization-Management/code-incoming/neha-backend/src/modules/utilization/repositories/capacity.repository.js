let capacities = [];
let idCounter = 1;

const seed = () => {
  capacities = [
    { id: idCounter++, orgId: 1, department: 'Engineering', weeklyCapacity: 160, monthlyCapacity: 640, availableHours: 40, allocatedHours: 120, remainingHours: 40 },
    { id: idCounter++, orgId: 1, department: 'Product', weeklyCapacity: 80, monthlyCapacity: 320, availableHours: 20, allocatedHours: 60, remainingHours: 20 },
    { id: idCounter++, orgId: 1, department: 'Design', weeklyCapacity: 40, monthlyCapacity: 160, availableHours: 10, allocatedHours: 30, remainingHours: 10 }
  ];
};

seed();

const findAll = async (filters) => {
  const { department, page = 1, limit = 10, orgId } = filters;
  let filtered = capacities.filter(c => c.orgId === orgId);
  if (department) filtered = filtered.filter(c => c.department === department);
  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  return { items: paginated, total };
};

const findById = async (id, orgId) => {
  return capacities.find(c => c.id === parseInt(id) && c.orgId === orgId) || null;
};

const create = async (data) => {
  const newItem = { id: idCounter++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  capacities.push(newItem);
  return newItem;
};

const update = async (id, data, orgId) => {
  const index = capacities.findIndex(c => c.id === parseInt(id) && c.orgId === orgId);
  if (index === -1) return null;
  capacities[index] = { ...capacities[index], ...data, updatedAt: new Date().toISOString() };
  return capacities[index];
};

module.exports = { findAll, findById, create, update };