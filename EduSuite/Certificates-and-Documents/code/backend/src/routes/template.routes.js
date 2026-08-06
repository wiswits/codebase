const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const TemplateController = {
  getTemplates: async (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, name: 'Academic Excellence Certificate', type: 'certificate', status: 'published', version: '1.0', created_at: new Date().toISOString() },
        { id: 2, name: 'Sports Day Certificate', type: 'certificate', status: 'published', version: '1.0', created_at: new Date().toISOString() },
        { id: 3, name: 'Student ID Card', type: 'id_card', status: 'published', version: '1.0', created_at: new Date().toISOString() },
        { id: 4, name: 'Bonafide Certificate', type: 'bonafide', status: 'draft', version: '0.5', created_at: new Date().toISOString() },
        { id: 5, name: 'Transfer Certificate', type: 'tc', status: 'review', version: '0.8', created_at: new Date().toISOString() }
      ]
    });
  },
  
  getTemplateStats: async (req, res) => {
    res.json({
      success: true,
      data: { total: 12, published: 8, draft: 2, review: 1, archived: 1 }
    });
  },
  
  getTemplate: async (req, res) => {
    res.json({
      success: true,
      data: {
        id: parseInt(req.params.templateId),
        name: 'Academic Excellence Certificate',
        type: 'certificate',
        description: 'Certificate for academic achievements',
        designData: { background: '#FFFFFF', title: 'Academic Excellence Certificate', titleSize: 24, titleColor: '#0F2147' },
        placeholderData: { student_name: 'Student Name', grade: 'A+', date: '2025-01-15' },
        status: 'published',
        version: '1.0'
      }
    });
  },
  
  create: async (req, res) => {
    res.status(201).json({
      success: true,
      data: { id: Math.floor(Math.random() * 1000), ...req.body, created_at: new Date().toISOString() }
    });
  },
  
  updateTemplate: async (req, res) => {
    res.json({
      success: true,
      data: { id: parseInt(req.params.templateId), ...req.body, updated_at: new Date().toISOString() }
    });
  },
  
  publishTemplate: async (req, res) => {
    res.json({
      success: true,
      data: { id: parseInt(req.params.templateId), status: 'published', published_at: new Date().toISOString() }
    });
  },
  
  archiveTemplate: async (req, res) => {
    res.json({
      success: true,
      data: { id: parseInt(req.params.templateId), status: 'archived', archived_at: new Date().toISOString() }
    });
  },
  
  cloneTemplate: async (req, res) => {
    res.status(201).json({
      success: true,
      data: { id: Math.floor(Math.random() * 1000), name: req.body.name || 'Cloned Template', status: 'draft', cloned_from: parseInt(req.params.templateId) }
    });
  },
  
  uploadTemplate: async (req, res) => {
    res.json({
      success: true,
      data: { id: parseInt(req.params.templateId), uploaded: true, message: 'Template uploaded successfully' }
    });
  },
  
  getVersions: async (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, version: '1.0', created_at: new Date().toISOString(), created_by: 'Admin User', change_log: 'Initial version' },
        { id: 2, version: '1.1', created_at: new Date().toISOString(), created_by: 'Admin User', change_log: 'Updated design' }
      ]
    });
  }
};

router.use(authenticate);
router.get('/', TemplateController.getTemplates.bind(TemplateController));
router.get('/stats', TemplateController.getTemplateStats.bind(TemplateController));
router.get('/:templateId', TemplateController.getTemplate.bind(TemplateController));
router.post('/', TemplateController.create.bind(TemplateController));
router.put('/:templateId', TemplateController.updateTemplate.bind(TemplateController));
router.post('/:templateId/publish', TemplateController.publishTemplate.bind(TemplateController));
router.post('/:templateId/archive', TemplateController.archiveTemplate.bind(TemplateController));
router.post('/:templateId/clone', TemplateController.cloneTemplate.bind(TemplateController));
router.post('/:templateId/upload', TemplateController.uploadTemplate.bind(TemplateController));
router.get('/:templateId/versions', TemplateController.getVersions.bind(TemplateController));

module.exports = router;