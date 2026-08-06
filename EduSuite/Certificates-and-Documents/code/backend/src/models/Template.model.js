const { getConnection } = require('../config/database');

class TemplateModel {
  static async create(templateData) {
    const db = await getConnection();
    const {
      orgId,
      name,
      type,
      category,
      description,
      designData,
      placeholderData,
      version = '1.0',
      status = 'draft',
      createdBy
    } = templateData;

    const [result] = await db.query(
      `INSERT INTO document_templates 
       (org_id, name, type, category, description, design_data, placeholder_data, 
        version, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orgId, name, type, category, description, 
       JSON.stringify(designData), JSON.stringify(placeholderData),
       version, status, createdBy]
    );

    return result.insertId;
  }

  static async findById(id, orgId) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT t.*, u.first_name, u.last_name
       FROM document_templates t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = ? AND t.org_id = ?`,
      [id, orgId]
    );
    return rows[0] || null;
  }

  static async getTemplatesByOrg(orgId, filters = {}, limit = 50, offset = 0) {
    const db = await getConnection();
    let query = `SELECT t.*, u.first_name, u.last_name
                 FROM document_templates t
                 LEFT JOIN users u ON t.created_by = u.id
                 WHERE t.org_id = ? AND t.is_active = TRUE`;
    const params = [orgId];

    if (filters.status) {
      query += ' AND t.status = ?';
      params.push(filters.status);
    }

    if (filters.type) {
      query += ' AND t.type = ?';
      params.push(filters.type);
    }

    if (filters.search) {
      query += ' AND t.name LIKE ?';
      params.push(`%${filters.search}%`);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async update(id, orgId, updates) {
    const db = await getConnection();
    const allowedFields = ['name', 'category', 'description', 'design_data', 
                          'placeholder_data', 'version', 'status', 'is_active'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(['design_data', 'placeholder_data'].includes(key) 
          ? JSON.stringify(value) 
          : value);
      }
    }

    if (fields.length === 0) return null;

    values.push(id, orgId);
    const [result] = await db.query(
      `UPDATE document_templates SET ${fields.join(', ')} WHERE id = ? AND org_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async saveVersion(templateId, versionData) {
    const db = await getConnection();
    const { version, designData, placeholderData, changeLog, createdBy } = versionData;

    const [result] = await db.query(
      `INSERT INTO document_versions 
       (template_id, version, design_data, placeholder_data, change_log, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [templateId, version, JSON.stringify(designData), 
       JSON.stringify(placeholderData), changeLog, createdBy]
    );

    return result.insertId;
  }

  static async getVersions(templateId) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT v.*, u.first_name, u.last_name
       FROM document_versions v
       LEFT JOIN users u ON v.created_by = u.id
       WHERE v.template_id = ?
       ORDER BY v.created_at DESC`,
      [templateId]
    );
    return rows;
  }

  static async cloneTemplate(id, orgId, newName, createdBy) {
    const db = await getConnection();
    const template = await this.findById(id, orgId);
    if (!template) return null;

    const [result] = await db.query(
      `INSERT INTO document_templates 
       (org_id, name, type, category, description, design_data, placeholder_data, 
        version, status, created_by)
       SELECT org_id, ?, type, category, description, design_data, placeholder_data,
        '1.0', 'draft', ?
       FROM document_templates
       WHERE id = ? AND org_id = ?`,
      [newName, createdBy, id, orgId]
    );

    return result.insertId;
  }

  static async publishTemplate(id, orgId) {
    const db = await getConnection();
    const [result] = await db.query(
      'UPDATE document_templates SET status = "published" WHERE id = ? AND org_id = ?',
      [id, orgId]
    );
    return result.affectedRows > 0;
  }

  static async archiveTemplate(id, orgId) {
    const db = await getConnection();
    const [result] = await db.query(
      'UPDATE document_templates SET status = "archived", is_active = FALSE WHERE id = ? AND org_id = ?',
      [id, orgId]
    );
    return result.affectedRows > 0;
  }

  static async getTemplateStats(orgId) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived
       FROM document_templates
       WHERE org_id = ? AND is_active = TRUE`,
      [orgId]
    );
    return rows[0] || { total: 0, published: 0, draft: 0, review: 0, archived: 0 };
  }
}

module.exports = TemplateModel;