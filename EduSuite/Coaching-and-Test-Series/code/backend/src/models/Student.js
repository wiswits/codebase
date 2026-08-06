// ============================================
// STUDENT MODEL
// ============================================

const { query } = require('../config/database');
const { STUDENT_STATUS } = require('../utils/constants');

class Student {
    constructor(data = {}) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.student_code = data.student_code;
        this.dob = data.dob;
        this.gender = data.gender;
        this.address = data.address;
        this.parent_name = data.parent_name;
        this.parent_phone = data.parent_phone;
        this.parent_email = data.parent_email;
        this.enrollment_date = data.enrollment_date;
        this.target_exam = data.target_exam;
        this.current_batch_id = data.current_batch_id;
        this.status = data.status || STUDENT_STATUS.ACTIVE;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ============================================
    // STATIC METHODS
    // ============================================
    static async findById(id) {
        const result = await query(
            'SELECT * FROM students WHERE id = $1',
            [id]
        );
        return result.rows[0] ? new Student(result.rows[0]) : null;
    }

    static async findByUserId(userId) {
        const result = await query(
            'SELECT * FROM students WHERE user_id = $1',
            [userId]
        );
        return result.rows[0] ? new Student(result.rows[0]) : null;
    }

    static async findByCode(code) {
        const result = await query(
            'SELECT * FROM students WHERE student_code = $1',
            [code]
        );
        return result.rows[0] ? new Student(result.rows[0]) : null;
    }

    static async findAll(options = {}) {
        const { limit = 50, offset = 0, batch_id, status, search } = options;
        let queryText = `
            SELECT s.*, u.email, u.first_name, u.last_name, u.phone,
                   b.name as batch_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN batches b ON s.current_batch_id = b.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (batch_id) {
            queryText += ` AND s.current_batch_id = $${paramIndex}`;
            params.push(batch_id);
            paramIndex++;
        }

        if (status) {
            queryText += ` AND s.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (search) {
            queryText += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR s.student_code ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        queryText += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows.map(row => new Student(row));
    }

    static async getStudentsByBatch(batchId) {
        const result = await query(
            `SELECT s.*, u.email, u.first_name, u.last_name, u.phone
             FROM students s
             JOIN users u ON s.user_id = u.id
             JOIN batch_students bs ON s.id = bs.student_id
             WHERE bs.batch_id = $1 AND bs.is_current = true
             ORDER BY s.created_at DESC`,
            [batchId]
        );
        return result.rows.map(row => new Student(row));
    }

    // ============================================
    // INSTANCE METHODS
    // ============================================
    async save() {
        if (this.id) {
            const result = await query(
                `UPDATE students SET
                    dob = COALESCE($1, dob),
                    gender = COALESCE($2, gender),
                    address = COALESCE($3, address),
                    parent_name = COALESCE($4, parent_name),
                    parent_phone = COALESCE($5, parent_phone),
                    parent_email = COALESCE($6, parent_email),
                    target_exam = COALESCE($7, target_exam),
                    current_batch_id = COALESCE($8, current_batch_id),
                    status = COALESCE($9, status),
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $10
                 RETURNING *`,
                [this.dob, this.gender, this.address, this.parent_name,
                 this.parent_phone, this.parent_email, this.target_exam,
                 this.current_batch_id, this.status, this.id]
            );
            if (result.rows.length === 0) return null;
            Object.assign(this, result.rows[0]);
            return this;
        } else {
            const result = await query(
                `INSERT INTO students (
                    user_id, student_code, dob, gender, address,
                    parent_name, parent_phone, parent_email,
                    enrollment_date, target_exam, current_batch_id, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *`,
                [this.user_id, this.student_code, this.dob, this.gender,
                 this.address, this.parent_name, this.parent_phone,
                 this.parent_email, this.enrollment_date || new Date(),
                 this.target_exam, this.current_batch_id, this.status]
            );
            Object.assign(this, result.rows[0]);
            return this;
        }
    }

    async getBatchHistory() {
        const result = await query(
            `SELECT bh.*, 
                    from_b.name as from_batch_name,
                    to_b.name as to_batch_name,
                    u.first_name || ' ' || u.last_name as triggered_by_name
             FROM batch_history bh
             LEFT JOIN batches from_b ON bh.from_batch_id = from_b.id
             LEFT JOIN batches to_b ON bh.to_batch_id = to_b.id
             LEFT JOIN users u ON bh.triggered_by = u.id
             WHERE bh.student_id = $1
             ORDER BY bh.moved_at DESC`,
            [this.id]
        );
        return result.rows;
    }

    async getAttempts(options = {}) {
        const { limit = 20, offset = 0 } = options;
        const result = await query(
            `SELECT a.*, t.title as test_title, t.type as test_type,
                    t.total_marks, t.duration_minutes
             FROM attempts a
             JOIN tests t ON a.test_id = t.id
             WHERE a.student_id = $1
             ORDER BY a.created_at DESC
             LIMIT $2 OFFSET $3`,
            [this.id, limit, offset]
        );
        return result.rows;
    }

    async getAnalytics() {
        const result = await query(
            `SELECT 
                COUNT(*) as total_attempts,
                AVG(score_obtained) as avg_score,
                AVG(overall_accuracy) as avg_accuracy,
                MAX(score_obtained) as highest_score
             FROM analytics
             WHERE student_id = $1`,
            [this.id]
        );
        return result.rows[0] || {};
    }

    async getCurrentBatch() {
        if (!this.current_batch_id) return null;
        const result = await query(
            'SELECT * FROM batches WHERE id = $1',
            [this.current_batch_id]
        );
        return result.rows[0] || null;
    }

    async getErrorBookStats() {
        const result = await query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN is_mastered = true THEN 1 END) as mastered,
                COUNT(CASE WHEN is_mastered = false AND in_active_deck = true THEN 1 END) as in_progress
             FROM error_book
             WHERE student_id = $1`,
            [this.id]
        );
        return result.rows[0] || { total: 0, mastered: 0, in_progress: 0 };
    }

    // ============================================
    // HELPERS
    // ============================================
    toJSON() {
        return { ...this };
    }
}

module.exports = Student;