const projectService = require('../services/project.service');

const getAll = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const orgId = 1;
    const result = await projectService.getAll({
      status,
      search,
      page: parseInt(page),
      limit: parseInt(limit),
      orgId
    });
    res.status(200).json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = 1;
    const project = await projectService.getById(id, orgId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const data = req.body;
    const orgId = 1;
    const project = await projectService.create({ ...data, orgId });
    res.status(201).json({ success: true, message: 'Project created', data: project });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const orgId = 1;
    const updated = await projectService.update(id, data, orgId);
    if (!updated) return res.status(404).json({ success: false, message: 'Project not found' });
    res.status(200).json({ success: true, message: 'Project updated', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = 1;
    const deleted = await projectService.remove(id, orgId);
    if (!deleted) return res.status(404).json({ success: false, message: 'Project not found' });
    res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };