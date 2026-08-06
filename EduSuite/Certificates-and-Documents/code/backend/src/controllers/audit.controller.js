const { getAuditLogs, getAuditStats } = require('../services/audit.service');
const { logger } = require('../utils/logger');
const ExcelJS = require('exceljs');

class AuditController {
  static async getAuditLogs(req, res) {
    try {
      const { orgId } = req.user;
      const { userId, resourceType, action, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;

      const logs = await getAuditLogs({
        orgId,
        userId,
        resourceType,
        action,
        dateFrom,
        dateTo,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: logs,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      logger.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getAuditLogsByResource(req, res) {
    try {
      const { orgId } = req.user;
      const { resourceType, resourceId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const logs = await getAuditLogs({
        orgId,
        resourceType,
        resourceId: parseInt(resourceId),
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: logs,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      logger.error('Get audit logs by resource error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getAuditLogsByUser(req, res) {
    try {
      const { orgId } = req.user;
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const logs = await getAuditLogs({
        orgId,
        userId: parseInt(userId),
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: logs,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      logger.error('Get audit logs by user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getAuditStats(req, res) {
    try {
      const { orgId } = req.user;
      const stats = await getAuditStats(orgId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Get audit stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async exportAuditLogs(req, res) {
    try {
      const { orgId } = req.user;
      const { dateFrom, dateTo, format = 'excel' } = req.query;

      const logs = await getAuditLogs({
        orgId,
        dateFrom,
        dateTo,
        limit: 10000
      });

      if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Audit Logs');

        // Add headers
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'User ID', key: 'user_id', width: 15 },
          { header: 'Action', key: 'action', width: 15 },
          { header: 'Resource Type', key: 'resource_type', width: 20 },
          { header: 'Resource ID', key: 'resource_id', width: 15 },
          { header: 'IP Address', key: 'ip_address', width: 20 },
          { header: 'Timestamp', key: 'created_at', width: 25 }
        ];

        // Add data
        logs.forEach(log => {
          worksheet.addRow({
            id: log.id,
            user_id: log.user_id,
            action: log.action,
            resource_type: log.resource_type,
            resource_id: log.resource_id,
            ip_address: log.ip_address,
            created_at: log.created_at
          });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
      } else {
        res.json({
          success: true,
          data: logs
        });
      }

    } catch (error) {
      logger.error('Export audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = AuditController;