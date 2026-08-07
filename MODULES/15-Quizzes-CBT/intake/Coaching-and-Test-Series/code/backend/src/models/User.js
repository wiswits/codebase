// ============================================
// USER MODEL
// ============================================

const { pool, query } = require('../config/database');
const { hashPassword, comparePassword } = require('../config/auth');
const { USER_ROLES } = require('../utils/constants');

class User {
    constructor(data = {}) {
        this.id = data.id;
        this.email = data.email;
        this.password_hash = data.password_hash;
        this.role = data.role || USER_ROLES.STUDENT;
        this.first_name = data.first_name;
        this.last_name = data.last_name;
        this.phone = data.phone;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.last_login = data.last_login;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ============================================
    // STATIC METHODS
    // ============================================
    static async findByEmail(email) {
        const result = await query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] ? new User(result.rows[0]) : null;
    }

    static async findById(id) {
        const result = await query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] ? new User(result.rows[0]) : null;
    }

    static async findAll(options = {}) {
        const { limit = 50, offset = 0, role, is_active } = options;
        let queryText = 'SELECT * FROM users WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (role) {
            queryText += ` AND role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        if (is_active !== undefined) {
            queryText += ` AND is_active = $${paramIndex}`;
            params.push(is_active);
            paramIndex++;
        }

        queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows.map(row => new User(row));
    }

    // ============================================
    // INSTANCE METHODS
    // ============================================
    async save() {
        if (this.id) {
            // Update existing user
            const result = await query(
                `UPDATE users SET
                    email = $1,
                    first_name = $2,
                    last_name = $3,
                    phone = $4,
                    is_active = $5,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $6
                 RETURNING *`,
                [this.email, this.first_name, this.last_name,
                 this.phone, this.is_active, this.id]
            );
            if (result.rows.length === 0) return null;
            Object.assign(this, result.rows[0]);
            return this;
        } else {
            // Create new user
            const passwordHash = await hashPassword(this.password_hash);
            const result = await query(
                `INSERT INTO users (
                    email, password_hash, role, first_name, last_name, phone, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *`,
                [this.email, passwordHash, this.role,
                 this.first_name, this.last_name, this.phone, this.is_active]
            );
            Object.assign(this, result.rows[0]);
            return this;
        }
    }

    async verifyPassword(password) {
        return await comparePassword(password, this.password_hash);
    }

    async updateLastLogin() {
        const result = await query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
            [this.id]
        );
        if (result.rows.length > 0) {
            Object.assign(this, result.rows[0]);
            return this;
        }
        return null;
    }

    async updatePassword(newPassword) {
        const passwordHash = await hashPassword(newPassword);
        const result = await query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [passwordHash, this.id]
        );
        if (result.rows.length > 0) {
            Object.assign(this, result.rows[0]);
            return this;
        }
        return null;
    }

    async softDelete() {
        const result = await query(
            'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
            [this.id]
        );
        if (result.rows.length > 0) {
            Object.assign(this, result.rows[0]);
            return this;
        }
        return null;
    }

    // ============================================
    // RELATIONSHIPS
    // ============================================
    async getStudentProfile() {
        if (this.role !== USER_ROLES.STUDENT) return null;
        const result = await query(
            'SELECT * FROM students WHERE user_id = $1',
            [this.id]
        );
        return result.rows[0] || null;
    }

    async getFacultyProfile() {
        if (this.role !== USER_ROLES.FACULTY) return null;
        const result = await query(
            'SELECT * FROM faculty WHERE user_id = $1',
            [this.id]
        );
        return result.rows[0] || null;
    }

    // ============================================
    // HELPERS
    // ============================================
    toJSON() {
        const { password_hash, ...user } = this;
        return user;
    }

    getFullName() {
        return `${this.first_name || ''} ${this.last_name || ''}`.trim();
    }
}

module.exports = User;