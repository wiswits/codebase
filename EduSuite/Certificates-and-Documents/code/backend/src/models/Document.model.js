const { getConnection } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class DocumentModel {
  static async create(documentData) {
    const db = await getConnection();
    const {
      orgId,
      templateId,
      documentType,
      title,
      description,
      metadata,
      status = 'draft',
      issueDate,
      expiryDate,
      createdBy
    } = documentData;

    const documentNumber = `DOC-${Date.now()}-${uuidv4().slice(0, 8)}`;

    const [result] = await db.query(
      `INSERT INTO documents 
       (org_id, template_id, document_type, document_number, title, description, 
        metadata, status, issue_date, expiry_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orgId, templateId, documentType, documentNumber, title, description,
       JSON.stringify(metadata), status, issueDate, expiryDate, createdBy]
    );

    return result.insertId;
  }

  static async findById(id, orgId) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT d.*, t.name as template_name, t.type as template_type,
       u.first_name, u.last_name, u.email as created_by_email
       FROM documents d
       LEFT JOIN document_templates t ON d.template_id = t.id
       LEFT JOIN users u ON d.created_by = u.id
       WHERE d.id = ? AND d.org_id = ?`,
      [id, orgId]
    );
    return rows[0] || null;
  }

  static async findByDocumentNumber(documentNumber) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT d.*, o.name as organization_name,
       t.name as template_name, t.type as template_type,
       u.first_name, u.last_name, u.email as created_by_email
       FROM documents d
       LEFT JOIN organizations o ON d.org_id = o.id
       LEFT JOIN document_templates t ON d.template_id = t.id
       LEFT JOIN users u ON d.created_by = u.id
       WHERE d.document_number = ?`,
      [documentNumber]
    );
    return rows[0] || null;
  }

  static async getDocumentsByOrg(orgId, filters = {}, limit = 50, offset = 0) {
    const db = await getConnection();
    let query = `SELECT d.*, t.name as template_name, u.first_name, u.last_name
                 FROM documents d
                 LEFT JOIN document_templates t ON d.template_id = t.id
                 LEFT JOIN users u ON d.created_by = u.id
                 WHERE d.org_id = ?`;
    const params = [orgId];

    if (filters.status) {
      query += ' AND d.status = ?';
      params.push(filters.status);
    }

    if (filters.documentType) {
      query += ' AND d.document_type = ?';
      params.push(filters.documentType);
    }

    if (filters.dateFrom) {
      query += ' AND d.created_at >= ?';
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      query += ' AND d.created_at <= ?';
      params.push(filters.dateTo);
    }

    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async updateStatus(id, orgId, status, reason = null) {
    const db = await getConnection();
    const [result] = await db.query(
      'UPDATE documents SET status = ? WHERE id = ? AND org_id = ?',
      [status, id, orgId]
    );
    return result.affectedRows > 0;
  }

  static async update(id, orgId, updates) {
    const db = await getConnection();
    const allowedFields = ['title', 'description', 'metadata', 'issue_date', 'expiry_date'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(key === 'metadata' ? JSON.stringify(value) : value);
      }
    }

    if (fields.length === 0) return null;

    values.push(id, orgId);
    const [result] = await db.query(
      `UPDATE documents SET ${fields.join(', ')} WHERE id = ? AND org_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async getDocumentStats(orgId) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END) as generated,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN status = 'printed' THEN 1 ELSE 0 END) as printed,
        SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today
       FROM documents
       WHERE org_id = ?`,
      [orgId]
    );
    return rows[0] || {
      total: 0,
      generated: 0,
      verified: 0,
      printed: 0,
      revoked: 0,
      archived: 0,
      today: 0
    };
  }

  static async getDocumentsByStatus(orgId, status) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT id, document_number, title, created_at
       FROM documents
       WHERE org_id = ? AND status = ?
       ORDER BY created_at DESC LIMIT 10`,
      [orgId, status]
    );
    return rows;
  }

  static async revokeDocument(id, orgId, reason) {
    const db = await getConnection();
    const [result] = await db.query(
      'UPDATE documents SET status = "revoked", metadata = JSON_SET(COALESCE(metadata, "{}"), "$.revoke_reason", ?) WHERE id = ? AND org_id = ?',
      [reason, id, orgId]
    );
    return result.affectedRows > 0;
  }

  static async archiveDocument(id, orgId) {
    const db = await getConnection();
    const [result] = await db.query(
      'UPDATE documents SET status = "archived" WHERE id = ? AND org_id = ?',
      [id, orgId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = DocumentModel;