let employees = [];
let idCounter = 1;

const seed = () => {
  employees = [
    { id: idCounter++, orgId: 1, name: 'Aarav Sharma', department: 'Engineering', designation: 'Senior Developer', employmentStatus: 'active', weeklyCapacity: 40, utilization: 85, allocationCount: 2, benchStatus: false },
    { id: idCounter++, orgId: 1, name: 'Priya Patel', department: 'Product', designation: 'Product Manager', employmentStatus: 'active', weeklyCapacity: 40, utilization: 90, allocationCount: 3, benchStatus: false },
    { id: idCounter++, orgId: 1, name: 'Vikram Singh', department: 'Design', designation: 'UX Designer', employmentStatus: 'active', weeklyCapacity: 40, utilization: 60, allocationCount: 1, benchStatus: false },
    { id: idCounter++, orgId: 1, name: 'Sneha Reddy', department: 'Engineering', designation: 'Developer', employmentStatus: 'bench', weeklyCapacity: 40, utilization: 0, allocationCount: 0, benchStatus: true },
    { id: idCounter++, orgId: 1, name: 'Rahul Kumar', department: 'Marketing', designation: 'Marketing Lead', employmentStatus: 'active', weeklyCapacity: 40, utilization: 95, allocationCount: 4, benchStatus: false }
  ];
};

seed();

const findAll = async (filters) => {
  const { search, department, status, page = 1, limit = 10, orgId } = filters;
  let filtered = employees.filter(e => e.orgId === orgId);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(e => e.name.toLowerCase().includes(s));
  }
  if (department) filtered = filtered.filter(e => e.department === department);
  if (status) filtered = filtered.filter(e => e.employmentStatus === status);
  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  return { items: paginated, total };
};

const findById = async (id, orgId) => {
  return employees.find(e => e.id === parseInt(id) && e.orgId === orgId) || null;
};

const create = async (data) => {
  const newItem = { id: idCounter++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  employees.push(newItem);
  return newItem;
};

const update = async (id, data, orgId) => {
  const index = employees.findIndex(e => e.id === parseInt(id) && e.orgId === orgId);
  if (index === -1) return null;
  employees[index] = { ...employees[index], ...data, updatedAt: new Date().toISOString() };
  return employees[index];
};

const remove = async (id, orgId) => {
  const index = employees.findIndex(e => e.id === parseInt(id) && e.orgId === orgId);
  if (index === -1) return false;
  employees.splice(index, 1);
  return true;
};

module.exports = { findAll, findById, create, update, remove };