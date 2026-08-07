const ApprovalModel = require('../models/Approval.model');
const DocumentModel = require('../models/Document.model');
const { auditLog } = require('../services/audit.service');
const { logger } = require('../utils/logger');

class ApprovalController {
  static async createApproval(req, res) {
    try {
      const { documentId, workflowType, approvers, deadline } = req.body;
      const { userId, orgId } = req.user;

      const document = await DocumentModel.findById(documentId, orgId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      const approvalId = await ApprovalModel.create({
        orgId,
        documentId,
        workflowType,
        approvers,
        deadline,
        createdBy: userId
      });

      const approval = await ApprovalModel.findById(approvalId, orgId);

      await auditLog({
        orgId,
        userId,
        action: 'CREATE_APPROVAL',
        resourceType: 'approval',
        resourceId: approvalId,
        newValue: { documentId, workflowType },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({
        success: true,
        data: approval
      });

    } catch (error) {
      logger.error('Create approval error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getApprovals(req, res) {
    try {
      const { orgId } = req.user;
      const { status, limit = 50, offset = 0 } = req.query;

      const approvals = await ApprovalModel.getApprovalsByOrg(orgId, {
        status
      }, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: approvals,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      logger.error('Get approvals error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getPendingApprovals(req, res) {
    try {
      const { orgId } = req.user;
      const approvals = await ApprovalModel.getPendingApprovals(orgId);

      res.json({
        success: true,
        data: approvals
      });

    } catch (error) {
      logger.error('Get pending approvals error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getApproval(req, res) {
    try {
      const { approvalId } = req.params;
      const { orgId } = req.user;

      const approval = await ApprovalModel.findById(approvalId, orgId);
      if (!approval) {
        return res.status(404).json({
          success: false,
          error: 'Approval not found'
        });
      }

      res.json({
        success: true,
        data: approval
      });

    } catch (error) {
      logger.error('Get approval error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async approve(req, res) {
    try {
      const { approvalId } = req.params;
      const { comments } = req.body;
      const { userId, orgId } = req.user;

      const approval = await ApprovalModel.findById(approvalId, orgId);
      if (!approval) {
        return res.status(404).json({
          success: false,
          error: 'Approval not found'
        });
      }

      const approved = await ApprovalModel.approve(approvalId, orgId, userId, comments);
      if (!approved) {
        return res.status(400).json({
          success: false,
          error: 'Cannot approve this request'
        });
      }

      // Update document status
      await DocumentModel.updateStatus(approval.document_id, orgId, 'approved');

      await auditLog({
        orgId,
        userId,
        action: 'APPROVE',
        resourceType: 'approval',
        resourceId: approvalId,
        newValue: { status: 'approved', comments },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      const updatedApproval = await ApprovalModel.findById(approvalId, orgId);

      res.json({
        success: true,
        data: updatedApproval
      });

    } catch (error) {
      logger.error('Approve error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async reject(req, res) {
    try {
      const { approvalId } = req.params;
      const { reason } = req.body;
      const { userId, orgId } = req.user;

      const approval = await ApprovalModel.findById(approvalId, orgId);
      if (!approval) {
        return res.status(404).json({
          success: false,
          error: 'Approval not found'
        });
      }

      const rejected = await ApprovalModel.reject(approvalId, orgId, userId, reason);
      if (!rejected) {
        return res.status(400).json({
          success: false,
          error: 'Cannot reject this request'
        });
      }

      await auditLog({
        orgId,
        userId,
        action: 'REJECT',
        resourceType: 'approval',
        resourceId: approvalId,
        newValue: { status: 'rejected', reason },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      const updatedApproval = await ApprovalModel.findById(approvalId, orgId);

      res.json({
        success: true,
        data: updatedApproval
      });

    } catch (error) {
      logger.error('Reject error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async reassignApproval(req, res) {
    try {
      const { approvalId } = req.params;
      const { newApproverId, comments } = req.body;
      const { userId, orgId } = req.user;

      const reassigned = await ApprovalModel.reassign(approvalId, orgId, newApproverId, userId, comments);
      if (!reassigned) {
        return res.status(404).json({
          success: false,
          error: 'Approval not found or cannot reassign'
        });
      }

      await auditLog({
        orgId,
        userId,
        action: 'REASSIGN',
        resourceType: 'approval',
        resourceId: approvalId,
        newValue: { newApproverId, comments },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      const approval = await ApprovalModel.findById(approvalId, orgId);

      res.json({
        success: true,
        data: approval
      });

    } catch (error) {
      logger.error('Reassign approval error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getApprovalStats(req, res) {
    try {
      const { orgId } = req.user;
      const stats = await ApprovalModel.getApprovalStats(orgId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Get approval stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = ApprovalController;