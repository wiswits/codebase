const { getConnection } = require('../config/database');

class ApprovalModel {
  static async create(approvalData) {
    const db = await getConnection();
    const {
      orgId,
      documentId,
      workflowType,
      approvers,
      deadline,
      createdBy
    } = approvalData;

    const [result] = await db.query(
      `INSERT INTO approval_workflows 
       (org_id, document_id, workflow_type, approvers, deadline, status, created_by)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [orgId, documentId, workflowType, JSON.stringify(approvers), deadline, createdBy]
    );

    return result.insertId;
  }

  static async findById(id, orgId) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT aw.*, d.title as document_title, d.document_number,
       u.first_name, u.last_name
       FROM approval_workflows aw
       JOIN documents d ON aw.document_id = d.id
       LEFT JOIN users u ON aw.created_by = u.id
       WHERE aw.id = ? AND aw.org_id = ?`,
      [id, orgId]
    );
    return rows[0] || null;
  }

  static async getApprovalsByOrg(orgId, filters = {}, limit = 50, offset = 0) {
    const db = await getConnection();
    let query = `SELECT aw.*, d.title as document_title, d.document_number,
                 u.first_name, u.last_name
                 FROM approval_workflows aw
                 JOIN documents d ON aw.document_id = d.id
                 LEFT JOIN users u ON aw.created_by = u.id
                 WHERE aw.org_id = ?`;
    const params = [orgId];

    if (filters.status) {
      query += ' AND aw.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY aw.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async getPendingApprovals(orgId) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT aw.*, d.title as document_title, d.document_number,
       u.first_name, u.last_name
       FROM approval_workflows aw
       JOIN documents d ON aw.document_id = d.id
       LEFT JOIN users u ON aw.created_by = u.id
       WHERE aw.org_id = ? AND aw.status = 'pending'
       ORDER BY aw.deadline ASC`,
      [orgId]
    );
    return rows;
  }

  static async approve(id, orgId, userId, comments) {
    const db = await getConnection();
    const [result] = await db.query(
      `UPDATE approval_workflows 
       SET status = 'approved', 
           approved_by = ?,
           approved_at = CURRENT_TIMESTAMP,
           comments = ?
       WHERE id = ? AND org_id = ? AND status = 'pending'`,
      [userId, comments, id, orgId]
    );
    return result.affectedRows > 0;
  }

  static async reject(id, orgId, userId, reason) {
    const db = await getConnection();
    const [result] = await db.query(
      `UPDATE approval_workflows 
       SET status = 'rejected', 
           rejected_by = ?,
           rejected_at = CURRENT_TIMESTAMP,
           reason = ?
       WHERE id = ? AND org_id = ? AND status = 'pending'`,
      [userId, reason, id, orgId]
    );
    return result.affectedRows > 0;
  }

  static async reassign(id, orgId, newApproverId, userId, comments) {
    const db = await getConnection();
    const [result] = await db.query(
      `UPDATE approval_workflows 
       SET approvers = JSON_ARRAY_APPEND(COALESCE(approvers, JSON_ARRAY()), '$', ?),
           reassigned_by = ?,
           reassigned_at = CURRENT_TIMESTAMP,
           comments = ?
       WHERE id = ? AND org_id = ? AND status = 'pending'`,
      [newApproverId, userId, comments, id, orgId]
    );
    return result.affectedRows > 0;
  }

  static async getApprovalStats(orgId) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'pending' AND deadline < CURDATE() THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today
       FROM approval_workflows
       WHERE org_id = ?`,
      [orgId]
    );
    return rows[0] || { total: 0, pending: 0, approved: 0, rejected: 0, overdue: 0, today: 0 };
  }
}

module.exports = ApprovalModel;