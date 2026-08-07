let projects = [];
let idCounter = 1;

const seed = () => {
  projects = [
    { id: idCounter++, orgId: 1, name: 'WisWits Platform', client: 'WisWits', department: 'Engineering', projectManager: 'Amit', status: 'active', startDate: '2026-01-01', endDate: '2026-12-31' },
    { id: idCounter++, orgId: 1, name: 'Mobile App Development', client: 'EduTech', department: 'Engineering', projectManager: 'Priya', status: 'active', startDate: '2026-03-01', endDate: '2026-09-30' },
    { id: idCounter++, orgId: 1, name: 'UI/UX Redesign', client: 'WisWits', department: 'Design', projectManager: 'Vikram', status: 'active', startDate: '2026-04-01', endDate: '2026-07-31' }
  ];
};

seed();

const findAll = async (filters) => {
  const { status, search, page = 1, limit = 10, orgId } = filters;
  let filtered = projects.filter(p => p.orgId === orgId);
  if (status) filtered = filtered.filter(p => p.status === status);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.client.toLowerCase().includes(s));
  }
  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  return { items: paginated, total };
};

const findById = async (id, orgId) => {
  return projects.find(p => p.id === parseInt(id) && p.orgId === orgId) || null;
};

const create = async (data) => {
  const newItem = { id: idCounter++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  projects.push(newItem);
  return newItem;
};

const update = async (id, data, orgId) => {
  const index = projects.findIndex(p => p.id === parseInt(id) && p.orgId === orgId);
  if (index === -1) return null;
  projects[index] = { ...projects[index], ...data, updatedAt: new Date().toISOString() };
  return projects[index];
};

const remove = async (id, orgId) => {
  const index = projects.findIndex(p => p.id === parseInt(id) && p.orgId === orgId);
  if (index === -1) return false;
  projects.splice(index, 1);
  return true;
};

module.exports = { findAll, findById, create, update, remove };