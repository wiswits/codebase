const { getConnection } = require('../config/database');

class PrintJobModel {
  static async create(printJobData) {
    const db = await getConnection();
    const {
      orgId,
      documentIds,
      jobType,
      priority = 'normal',
      printerName,
      createdBy
    } = printJobData;

    const [result] = await db.query(
      `INSERT INTO print_jobs 
       (org_id, document_ids, job_type, priority, printer_name, status, created_by)
       VALUES (?, ?, ?, ?, ?, 'queued', ?)`,
      [orgId, JSON.stringify(documentIds), jobType, priority, printerName, createdBy]
    );

    return result.insertId;
  }

  static async findById(id, orgId) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT pj.*, u.first_name, u.last_name
       FROM print_jobs pj
       LEFT JOIN users u ON pj.created_by = u.id
       WHERE pj.id = ? AND pj.org_id = ?`,
      [id, orgId]
    );
    return rows[0] || null;
  }

  static async getPrintJobsByOrg(orgId, filters = {}, limit = 50, offset = 0) {
    const db = await getConnection();
    let query = `SELECT pj.*, u.first_name, u.last_name
                 FROM print_jobs pj
                 LEFT JOIN users u ON pj.created_by = u.id
                 WHERE pj.org_id = ?`;
    const params = [orgId];

    if (filters.status) {
      query += ' AND pj.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY pj.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async getPrintQueue(orgId) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT pj.*, u.first_name, u.last_name,
       (SELECT COUNT(*) FROM documents WHERE JSON_CONTAINS(pj.document_ids, CAST(id AS JSON))) as doc_count
       FROM print_jobs pj
       LEFT JOIN users u ON pj.created_by = u.id
       WHERE pj.org_id = ? AND pj.status IN ('queued', 'processing')
       ORDER BY FIELD(pj.priority, 'high', 'normal', 'low'), pj.created_at ASC`,
      [orgId]
    );
    return rows;
  }

  static async startJob(id, orgId) {
    const db = await getConnection();
    const [result] = await db.query(
      `UPDATE print_jobs 
       SET status = 'processing', started_at = CURRENT_TIMESTAMP
       WHERE id = ? AND org_id = ? AND status = 'queued'`,
      [id, orgId]
    );
    return result.affectedRows > 0;
  }

  static async completeJob(id, orgId) {
    const db = await getConnection();
    const [result] = await db.query(
      `UPDATE print_jobs 
       SET status = 'completed', completed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND org_id = ? AND status = 'processing'`,
      [id, orgId]
    );
    return result.affectedRows > 0;
  }

  static async failJob(id, orgId, errorMessage) {
    const db = await getConnection();
    const [result] = await db.query(
      `UPDATE print_jobs 
       SET status = 'failed', error_message = ?, completed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND org_id = ? AND status IN ('queued', 'processing')`,
      [errorMessage, id, orgId]
    );
    return result.affectedRows > 0;
  }

  static async cancelJob(id, orgId) {
    const db = await getConnection();
    const [result] = await db.query(
      `UPDATE print_jobs 
       SET status = 'cancelled', completed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND org_id = ? AND status IN ('queued', 'processing')`,
      [id, orgId]
    );
    return result.affectedRows > 0;
  }

  static async getPrintStats(orgId) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today
       FROM print_jobs
       WHERE org_id = ?`,
      [orgId]
    );
    return rows[0] || { total: 0, queued: 0, processing: 0, completed: 0, failed: 0, cancelled: 0, today: 0 };
  }
}

module.exports = PrintJobModel;