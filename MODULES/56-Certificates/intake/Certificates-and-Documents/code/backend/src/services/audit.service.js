const { getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

const auditLog = async ({
  orgId,
  userId,
  action,
  resourceType,
  resourceId,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  userAgent = null,
  deviceInfo = null,
  reason = null
}) => {
  try {
    const db = await getConnection();
    
    await db.query(
      `INSERT INTO audit_logs 
       (org_id, user_id, action, resource_type, resource_id, 
        old_value, new_value, ip_address, user_agent, device_info, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orgId,
        userId,
        action,
        resourceType,
        resourceId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ipAddress,
        userAgent,
        deviceInfo ? JSON.stringify(deviceInfo) : null,
        reason
      ]
    );

    logger.info(`Audit: ${action} on ${resourceType} ${resourceId} by user ${userId}`);
  } catch (error) {
    logger.error('Audit log error:', error);
    // Don't throw - audit failures shouldn't break the main flow
  }
};

const getAuditLogs = async ({
  orgId,
  userId,
  resourceType,
  action,
  dateFrom,
  dateTo,
  limit = 50,
  offset = 0
}) => {
  try {
    const db = await getConnection();
    let query = `SELECT * FROM audit_logs WHERE org_id = ?`;
    const params = [orgId];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (resourceType) {
      query += ' AND resource_type = ?';
      params.push(resourceType);
    }

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    if (dateFrom) {
      query += ' AND created_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ' AND created_at <= ?';
      params.push(dateTo);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return rows;
  } catch (error) {
    logger.error('Get audit logs error:', error);
    throw error;
  }
};

const getAuditStats = async (orgId) => {
  try {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN action = 'CREATE' THEN 1 ELSE 0 END) as created,
        SUM(CASE WHEN action = 'UPDATE' THEN 1 ELSE 0 END) as updated,
        SUM(CASE WHEN action = 'DELETE' THEN 1 ELSE 0 END) as deleted,
        SUM(CASE WHEN action = 'GENERATE' THEN 1 ELSE 0 END) as generated,
        SUM(CASE WHEN action = 'VERIFY' THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today
       FROM audit_logs
       WHERE org_id = ?`,
      [orgId]
    );
    return rows[0] || { total: 0, created: 0, updated: 0, deleted: 0, generated: 0, verified: 0, today: 0 };
  } catch (error) {
    logger.error('Get audit stats error:', error);
    throw error;
  }
};

module.exports = {
  auditLog,
  getAuditLogs,
  getAuditStats
};