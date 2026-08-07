const DocumentModel = require('../models/Document.model');
const TemplateModel = require('../models/Template.model');
const ApprovalModel = require('../models/Approval.model');
const PrintJobModel = require('../models/PrintJob.model');
const { getAuditStats } = require('../services/audit.service');
const { logger } = require('../utils/logger');

class DashboardController {
  static async getStats(req, res) {
    try {
      const { orgId } = req.user;

      const documentStats = await DocumentModel.getDocumentStats(orgId);
      const templateStats = await TemplateModel.getTemplateStats(orgId);
      const approvalStats = await ApprovalModel.getApprovalStats(orgId);
      const printStats = await PrintJobModel.getPrintStats(orgId);
      const auditStats = await getAuditStats(orgId);

      res.json({
        success: true,
        data: {
          documents: documentStats,
          templates: templateStats,
          approvals: approvalStats,
          printJobs: printStats,
          audits: auditStats
        }
      });

    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getRecentActivities(req, res) {
    try {
      const { orgId } = req.user;
      const { limit = 10 } = req.query;

      const documents = await DocumentModel.getDocumentsByOrg(orgId, {}, parseInt(limit), 0);
      
      const approvals = await ApprovalModel.getApprovalsByOrg(orgId, {}, parseInt(limit), 0);

      const activities = [];

      documents.forEach(doc => {
        activities.push({
          id: `doc-${doc.id}`,
          type: 'document',
          title: doc.title,
          description: `${doc.document_type} - ${doc.document_number}`,
          status: doc.status,
          timestamp: doc.created_at,
          icon: 'FileText'
        });
      });

      approvals.forEach(approval => {
        activities.push({
          id: `app-${approval.id}`,
          type: 'approval',
          title: `Approval ${approval.status}`,
          description: `Document: ${approval.document_title}`,
          status: approval.status,
          timestamp: approval.created_at,
          icon: 'CheckCircle'
        });
      });

      // Sort by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      res.json({
        success: true,
        data: activities.slice(0, parseInt(limit))
      });

    } catch (error) {
      logger.error('Get recent activities error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getChartData(req, res) {
    try {
      const { orgId } = req.user;
      const { days = 7 } = req.query;

      const db = require('../config/database').getConnection;
      const connection = await db();

      const [rows] = await connection.query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as count,
          document_type
         FROM documents
         WHERE org_id = ? 
           AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY DATE(created_at), document_type
         ORDER BY date ASC`,
        [orgId, parseInt(days)]
      );

      // Format data for chart
      const chartData = [];
      const types = new Set(rows.map(r => r.document_type));

      for (let i = 0; i < parseInt(days); i++) {
        const date = new Date();
        date.setDate(date.getDate() - (parseInt(days) - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = { date: dateStr };
        types.forEach(type => {
          const row = rows.find(r => r.date === dateStr && r.document_type === type);
          dayData[type] = row ? parseInt(row.count) : 0;
        });
        dayData.total = rows.filter(r => r.date === dateStr).reduce((sum, r) => sum + parseInt(r.count), 0);
        
        chartData.push(dayData);
      }

      res.json({
        success: true,
        data: {
          chartData,
          types: Array.from(types)
        }
      });

    } catch (error) {
      logger.error('Get chart data error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getDistributionData(req, res) {
    try {
      const { orgId } = req.user;

      const db = require('../config/database').getConnection;
      const connection = await db();

      const [rows] = await connection.query(
        `SELECT 
          document_type,
          COUNT(*) as count
         FROM documents
         WHERE org_id = ?
         GROUP BY document_type`,
        [orgId]
      );

      const total = rows.reduce((sum, r) => sum + parseInt(r.count), 0);
      
      const distribution = rows.map(row => ({
        name: row.document_type,
        value: total > 0 ? Math.round((parseInt(row.count) / total) * 100) : 0,
        count: parseInt(row.count)
      }));

      res.json({
        success: true,
        data: distribution
      });

    } catch (error) {
      logger.error('Get distribution data error:', error);
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

  static async getQueueStatus(req, res) {
    try {
      const { orgId } = req.user;
      const stats = await PrintJobModel.getPrintStats(orgId);

      // Get active queue items
      const db = require('../config/database').getConnection;
      const connection = await db();

      const [queue] = await connection.query(
        `SELECT 
          status,
          COUNT(*) as count,
          SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority
         FROM print_jobs
         WHERE org_id = ? AND status IN ('queued', 'processing')
         GROUP BY status`,
        [orgId]
      );

      res.json({
        success: true,
        data: {
          stats,
          queue: queue || []
        }
      });

    } catch (error) {
      logger.error('Get queue status error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = DashboardController;