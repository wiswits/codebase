const { getConnection } = require('../config/database');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');

class UserModel {
  static async findByEmail(email, orgId) {
    const db = await getConnection();
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? AND org_id = ? AND is_active = TRUE',
      [email, orgId]
    );
    return rows[0] || null;
  }

  static async findById(id, orgId) {
    const db = await getConnection();
    const [rows] = await db.query(
      'SELECT u.*, o.name as organization_name FROM users u ' +
      'LEFT JOIN organizations o ON u.org_id = o.id ' +
      'WHERE u.id = ? AND u.org_id = ? AND u.is_active = TRUE',
      [id, orgId]
    );
    return rows[0] || null;
  }

  static async create(userData) {
    const db = await getConnection();
    const {
      orgId,
      email,
      password,
      firstName,
      lastName,
      role,
      permissions = null
    } = userData;

    const passwordHash = await bcrypt.hash(password, 12);
    
    const [result] = await db.query(
      `INSERT INTO users (org_id, email, password_hash, first_name, last_name, role, permissions)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orgId, email, passwordHash, firstName, lastName, role, JSON.stringify(permissions)]
    );

    return result.insertId;
  }

  static async update(id, orgId, updates) {
    const db = await getConnection();
    const allowedFields = ['first_name', 'last_name', 'role', 'permissions', 'is_active'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(key === 'permissions' ? JSON.stringify(value) : value);
      }
    }

    if (fields.length === 0) return null;

    values.push(id, orgId);
    const [result] = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ? AND org_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }

  static async updateLastLogin(id, orgId) {
    const db = await getConnection();
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ? AND org_id = ?',
      [id, orgId]
    );
  }

  static async getUsersByOrg(orgId, limit = 50, offset = 0) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT id, email, first_name, last_name, role, is_active, last_login, created_at
       FROM users WHERE org_id = ? AND is_active = TRUE
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [orgId, limit, offset]
    );
    return rows;
  }

  static async getUsersByRole(orgId, role) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT id, email, first_name, last_name, role
       FROM users WHERE org_id = ? AND role = ? AND is_active = TRUE`,
      [orgId, role]
    );
    return rows;
  }
}

module.exports = UserModel;