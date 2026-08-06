const DocumentModel = require('../models/Document.model');
const TemplateModel = require('../models/Template.model');
const { generateDocument } = require('../services/document.service');
const { auditLog } = require('../services/audit.service');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class DocumentController {
  static async create(req, res) {
    try {
      const { templateId, documentType, title, description, metadata, issueDate, expiryDate } = req.body;
      const { userId, orgId } = req.user;

      if (!documentType || !title) {
        return res.status(400).json({
          success: false,
          error: 'Document type and title are required'
        });
      }

      const documentId = await DocumentModel.create({
        orgId,
        templateId,
        documentType,
        title,
        description,
        metadata,
        status: 'draft',
        issueDate,
        expiryDate,
        createdBy: userId
      });

      const document = await DocumentModel.findById(documentId, orgId);

      await auditLog({
        orgId,
        userId,
        action: 'CREATE',
        resourceType: 'document',
        resourceId: documentId,
        newValue: { title, documentType },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({
        success: true,
        data: document
      });

    } catch (error) {
      logger.error('Create document error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async generate(req, res) {
    try {
      const { documentId } = req.params;
      const { userId, orgId } = req.user;

      const document = await DocumentModel.findById(documentId, orgId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      if (!document.template_id) {
        return res.status(400).json({
          success: false,
          error: 'No template associated with this document'
        });
      }

      const template = await TemplateModel.findById(document.template_id, orgId);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      const generatedData = await generateDocument({
        document,
        template,
        metadata: document.metadata || {}
      });

      await DocumentModel.updateStatus(documentId, orgId, 'generated');

      const updatedDocument = await DocumentModel.findById(documentId, orgId);

      await auditLog({
        orgId,
        userId,
        action: 'GENERATE',
        resourceType: 'document',
        resourceId: documentId,
        newValue: { status: 'generated' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: {
          document: updatedDocument,
          generatedData
        }
      });

    } catch (error) {
      logger.error('Generate document error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async verify(req, res) {
    try {
      const { documentId } = req.params;
      const { userId, orgId } = req.user;

      const document = await DocumentModel.findById(documentId, orgId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      await DocumentModel.updateStatus(documentId, orgId, 'verified');

      const updatedDocument = await DocumentModel.findById(documentId, orgId);

      await auditLog({
        orgId,
        userId,
        action: 'VERIFY',
        resourceType: 'document',
        resourceId: documentId,
        newValue: { status: 'verified' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: updatedDocument
      });

    } catch (error) {
      logger.error('Verify document error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getDocuments(req, res) {
    try {
      const { orgId } = req.user;
      const { status, documentType, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;

      const documents = await DocumentModel.getDocumentsByOrg(orgId, {
        status,
        documentType,
        dateFrom,
        dateTo
      }, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        }
      });

    } catch (error) {
      logger.error('Get documents error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getDocument(req, res) {
    try {
      const { documentId } = req.params;
      const { orgId } = req.user;

      const document = await DocumentModel.findById(documentId, orgId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      res.json({
        success: true,
        data: document
      });

    } catch (error) {
      logger.error('Get document error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async updateDocument(req, res) {
    try {
      const { documentId } = req.params;
      const { title, description, metadata, issueDate, expiryDate } = req.body;
      const { userId, orgId } = req.user;

      const updated = await DocumentModel.update(documentId, orgId, {
        title,
        description,
        metadata,
        issue_date: issueDate,
        expiry_date: expiryDate
      });

      if (!updated) {
        return res.status(400).json({
          success: false,
          error: 'Update failed'
        });
      }

      const document = await DocumentModel.findById(documentId, orgId);

      await auditLog({
        orgId,
        userId,
        action: 'UPDATE',
        resourceType: 'document',
        resourceId: documentId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: document
      });

    } catch (error) {
      logger.error('Update document error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async revokeDocument(req, res) {
    try {
      const { documentId } = req.params;
      const { reason } = req.body;
      const { userId, orgId } = req.user;

      const revoked = await DocumentModel.revokeDocument(documentId, orgId, reason);
      if (!revoked) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      const document = await DocumentModel.findById(documentId, orgId);

      await auditLog({
        orgId,
        userId,
        action: 'REVOKE',
        resourceType: 'document',
        resourceId: documentId,
        newValue: { status: 'revoked', reason },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: document
      });

    } catch (error) {
      logger.error('Revoke document error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async archiveDocument(req, res) {
    try {
      const { documentId } = req.params;
      const { userId, orgId } = req.user;

      const archived = await DocumentModel.archiveDocument(documentId, orgId);
      if (!archived) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      const document = await DocumentModel.findById(documentId, orgId);

      await auditLog({
        orgId,
        userId,
        action: 'ARCHIVE',
        resourceType: 'document',
        resourceId: documentId,
        newValue: { status: 'archived' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: document
      });

    } catch (error) {
      logger.error('Archive document error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getDocumentStats(req, res) {
    try {
      const { orgId } = req.user;
      const stats = await DocumentModel.getDocumentStats(orgId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Get document stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async bulkGenerate(req, res) {
    try {
      const { templateId, count, parameters } = req.body;
      const { userId, orgId } = req.user;

      if (!templateId || !count) {
        return res.status(400).json({
          success: false,
          error: 'Template ID and count are required'
        });
      }

      const template = await TemplateModel.findById(templateId, orgId);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      const documentIds = [];
      for (let i = 0; i < count; i++) {
        const docId = await DocumentModel.create({
          orgId,
          templateId,
          documentType: template.type,
          title: `${template.name} - ${i + 1}`,
          metadata: parameters ? parameters[i] : {},
          status: 'draft',
          createdBy: userId
        });
        documentIds.push(docId);
      }

      // Queue for generation
      const queueId = await this.queueGeneration({
        orgId,
        templateId,
        documentIds,
        totalCount: count,
        createdBy: userId
      });

      await auditLog({
        orgId,
        userId,
        action: 'BULK_GENERATE',
        resourceType: 'document',
        resourceId: queueId,
        newValue: { count, templateId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: {
          queueId,
          documentIds,
          totalCount: count
        }
      });

    } catch (error) {
      logger.error('Bulk generate error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async queueGeneration(data) {
    const db = await getConnection();
    const { orgId, templateId, documentIds, totalCount, createdBy } = data;

    const [result] = await db.query(
      `INSERT INTO generation_queue 
       (org_id, template_id, document_ids, total_count, status, created_by)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [orgId, templateId, JSON.stringify(documentIds), totalCount, createdBy]
    );

    return result.insertId;
  }
}

module.exports = DocumentController;