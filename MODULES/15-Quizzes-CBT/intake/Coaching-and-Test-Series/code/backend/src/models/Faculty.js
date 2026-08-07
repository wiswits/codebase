// ============================================
// FACULTY MODEL
// ============================================

const { query } = require('../config/database');

class Faculty {
    constructor(data = {}) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.faculty_code = data.faculty_code;
        this.subjects = data.subjects || [];
        this.specialization = data.specialization;
        this.hire_date = data.hire_date;
        this.qualification = data.qualification;
        this.experience_years = data.experience_years || 0;
        this.rating = data.rating || 0;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ============================================
    // STATIC METHODS
    // ============================================
    static async findById(id) {
        const result = await query(
            'SELECT * FROM faculty WHERE id = $1',
            [id]
        );
        return result.rows[0] ? new Faculty(result.rows[0]) : null;
    }

    static async findByUserId(userId) {
        const result = await query(
            'SELECT * FROM faculty WHERE user_id = $1',
            [userId]
        );
        return result.rows[0] ? new Faculty(result.rows[0]) : null;
    }

    static async findAll(options = {}) {
        const { limit = 50, offset = 0, is_active } = options;
        let queryText = 'SELECT * FROM faculty WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (is_active !== undefined) {
            queryText += ` AND is_active = $${paramIndex}`;
            params.push(is_active);
            paramIndex++;
        }

        queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows.map(row => new Faculty(row));
    }

    // ============================================
    // INSTANCE METHODS
    // ============================================
    async save() {
        if (this.id) {
            const result = await query(
                `UPDATE faculty SET
                    subjects = $1,
                    specialization = $2,
                    qualification = $3,
                    experience_years = $4,
                    is_active = $5,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $6
                 RETURNING *`,
                [this.subjects, this.specialization, this.qualification,
                 this.experience_years, this.is_active, this.id]
            );
            if (result.rows.length === 0) return null;
            Object.assign(this, result.rows[0]);
            return this;
        } else {
            const result = await query(
                `INSERT INTO faculty (
                    user_id, faculty_code, subjects, specialization,
                    hire_date, qualification, experience_years, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
                [this.user_id, this.faculty_code, this.subjects,
                 this.specialization, this.hire_date || new Date(),
                 this.qualification, this.experience_years, this.is_active]
            );
            Object.assign(this, result.rows[0]);
            return this;
        }
    }

    async getDashboardStats() {
        const result = await query(
            `SELECT 
                (SELECT COUNT(DISTINCT s.id) FROM students s
                 JOIN batch_students bs ON s.id = bs.student_id
                 JOIN batches b ON bs.batch_id = b.id
                 WHERE b.id IN (SELECT batch_id FROM tests WHERE created_by = $1)) as students,
                (SELECT COUNT(*) FROM doubts WHERE resolved_by = $1 AND status = 'resolved') as doubts_resolved,
                (SELECT COUNT(*) FROM tests WHERE created_by = $1) as tests_created,
                (SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - assigned_at))/3600) 
                 FROM doubts WHERE resolved_by = $1 AND resolved_at IS NOT NULL) as avg_response_hours`,
            [this.id]
        );
        return result.rows[0] || {};
    }

    async getStudents(options = {}) {
        const { limit = 50, offset = 0, search } = options;
        let queryText = `
            SELECT DISTINCT s.*, u.first_name, u.last_name, u.email,
                   b.name as batch_name, b.type as batch_type
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN batch_students bs ON s.id = bs.student_id
            JOIN batches b ON bs.batch_id = b.id
            WHERE b.id IN (SELECT DISTINCT batch_id FROM tests WHERE created_by = $1)
        `;
        const params = [this.id];
        let paramIndex = 2;

        if (search) {
            queryText += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR s.student_code ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        queryText += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows;
    }

    async getBatches() {
        const result = await query(
            `SELECT DISTINCT b.*,
                (SELECT COUNT(*) FROM batch_students WHERE batch_id = b.id AND is_current = true) as student_count
             FROM batches b
             JOIN tests t ON t.batch_id = b.id
             WHERE t.created_by = $1`,
            [this.id]
        );
        return result.rows;
    }

    async getDoubts(options = {}) {
        const { status, limit = 50, offset = 0 } = options;
        let queryText = `
            SELECT d.*, s.student_code,
                   u.first_name || ' ' || u.last_name as student_name
            FROM doubts d
            JOIN students s ON d.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE d.assigned_to = $1
        `;
        const params = [this.id];
        let paramIndex = 2;

        if (status) {
            queryText += ` AND d.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        queryText += ` ORDER BY d.sla_resolve_deadline ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows;
    }

    // ============================================
    // HELPERS
    // ============================================
    toJSON() {
        return { ...this };
    }
}

module.exports = Faculty;