// backend/src/controllers/template.controller.js
const { logger } = require('../utils/logger');

class TemplateController {
  static async create(req, res) {
    try {
      const { name, type, description, designData } = req.body;
      const { userId, orgId } = req.user;

      if (!name || !type || !designData) {
        return res.status(400).json({
          success: false,
          error: 'Name, type, and design data are required'
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          id: Math.floor(Math.random() * 1000),
          name,
          type,
          description,
          designData,
          status: 'draft',
          createdBy: userId,
          orgId: orgId,
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Create template error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getTemplates(req, res) {
    try {
      const templates = [
        {
          id: 1,
          name: 'Academic Excellence Certificate',
          type: 'certificate',
          status: 'published',
          version: '1.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Sports Day Certificate',
          type: 'certificate',
          status: 'published',
          version: '1.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Student ID Card',
          type: 'id_card',
          status: 'published',
          version: '1.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      return res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      logger.error('Get templates error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getTemplate(req, res) {
    try {
      const { templateId } = req.params;

      return res.json({
        success: true,
        data: {
          id: parseInt(templateId),
          name: 'Academic Excellence Certificate',
          type: 'certificate',
          description: 'Certificate for academic achievements',
          designData: {
            background: '#FFFFFF',
            title: 'Academic Excellence Certificate',
            titleSize: 24,
            titleColor: '#0F2147',
            border: true,
            borderColor: '#C8A04E'
          },
          placeholderData: {
            student_name: 'Student Name',
            grade: 'A+',
            date: '2025-01-15'
          },
          status: 'published',
          version: '1.0',
          created_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Get template error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async updateTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const { name, description, designData } = req.body;

      return res.json({
        success: true,
        data: {
          id: parseInt(templateId),
          name: name || 'Updated Template',
          description,
          designData,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Update template error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async cloneTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const { name } = req.body;

      return res.status(201).json({
        success: true,
        data: {
          id: Math.floor(Math.random() * 1000),
          name: name || `Clone of Template ${templateId}`,
          status: 'draft',
          clonedFrom: parseInt(templateId),
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Clone template error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async publishTemplate(req, res) {
    try {
      const { templateId } = req.params;

      return res.json({
        success: true,
        data: {
          id: parseInt(templateId),
          status: 'published',
          publishedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Publish template error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async archiveTemplate(req, res) {
    try {
      const { templateId } = req.params;

      return res.json({
        success: true,
        data: {
          id: parseInt(templateId),
          status: 'archived',
          archivedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Archive template error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getVersions(req, res) {
    try {
      const { templateId } = req.params;

      return res.json({
        success: true,
        data: [
          {
            id: 1,
            version: '1.0',
            created_at: new Date().toISOString(),
            created_by: 'Admin User',
            change_log: 'Initial version'
          },
          {
            id: 2,
            version: '1.1',
            created_at: new Date().toISOString(),
            created_by: 'Admin User',
            change_log: 'Updated design'
          }
        ]
      });
    } catch (error) {
      logger.error('Get versions error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getTemplateStats(req, res) {
    try {
      return res.json({
        success: true,
        data: {
          total: 12,
          published: 8,
          draft: 2,
          review: 1,
          archived: 1
        }
      });
    } catch (error) {
      logger.error('Get template stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
    }
  }
}

module.exports = TemplateController;