// ============================================
// BATCH MODEL
// ============================================

const { query } = require('../config/database');

class Batch {
    constructor(data = {}) {
        this.id = data.id;
        this.name = data.name;
        this.code = data.code;
        this.type = data.type;
        this.target_exam = data.target_exam;
        this.academic_year = data.academic_year;
        this.strength = data.strength || 0;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.auto_promote_enabled = data.auto_promote_enabled || false;
        this.promote_trigger_top = data.promote_trigger_top || 10;
        this.demote_trigger_bottom = data.demote_trigger_bottom || 10;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ============================================
    // STATIC METHODS
    // ============================================
    static async findById(id) {
        const result = await query(
            'SELECT * FROM batches WHERE id = $1',
            [id]
        );
        return result.rows[0] ? new Batch(result.rows[0]) : null;
    }

    static async findByCode(code) {
        const result = await query(
            'SELECT * FROM batches WHERE code = $1',
            [code]
        );
        return result.rows[0] ? new Batch(result.rows[0]) : null;
    }

    static async findAll(options = {}) {
        const { limit = 50, offset = 0, is_active, type } = options;
        let queryText = 'SELECT * FROM batches WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (is_active !== undefined) {
            queryText += ` AND is_active = $${paramIndex}`;
            params.push(is_active);
            paramIndex++;
        }

        if (type) {
            queryText += ` AND type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows.map(row => new Batch(row));
    }

    // ============================================
    // INSTANCE METHODS
    // ============================================
    async save() {
        if (this.id) {
            const result = await query(
                `UPDATE batches SET
                    name = $1,
                    type = $2,
                    target_exam = $3,
                    academic_year = $4,
                    is_active = $5,
                    auto_promote_enabled = $6,
                    promote_trigger_top = $7,
                    demote_trigger_bottom = $8,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $9
                 RETURNING *`,
                [this.name, this.type, this.target_exam,
                 this.academic_year, this.is_active,
                 this.auto_promote_enabled, this.promote_trigger_top,
                 this.demote_trigger_bottom, this.id]
            );
            if (result.rows.length === 0) return null;
            Object.assign(this, result.rows[0]);
            return this;
        } else {
            const result = await query(
                `INSERT INTO batches (
                    name, code, type, target_exam, academic_year,
                    is_active, auto_promote_enabled,
                    promote_trigger_top, demote_trigger_bottom
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [this.name, this.code, this.type, this.target_exam,
                 this.academic_year, this.is_active,
                 this.auto_promote_enabled, this.promote_trigger_top,
                 this.demote_trigger_bottom]
            );
            Object.assign(this, result.rows[0]);
            return this;
        }
    }

    async getStudents() {
        const result = await query(
            `SELECT s.*, u.email, u.first_name, u.last_name, u.phone,
                    u.is_active as user_active
             FROM students s
             JOIN users u ON s.user_id = u.id
             JOIN batch_students bs ON s.id = bs.student_id
             WHERE bs.batch_id = $1 AND bs.is_current = true
             ORDER BY s.created_at DESC`,
            [this.id]
        );
        return result.rows;
    }

    async getStudentCount() {
        const result = await query(
            'SELECT COUNT(*) FROM batch_students WHERE batch_id = $1 AND is_current = true',
            [this.id]
        );
        return parseInt(result.rows[0].count);
    }

    async addStudent(studentId) {
        // End current membership
        await query(
            'UPDATE batch_students SET is_current = false, left_at = CURRENT_DATE WHERE student_id = $1 AND is_current = true',
            [studentId]
        );

        // Add new membership
        const result = await query(
            `INSERT INTO batch_students (student_id, batch_id, joined_at, is_current)
             VALUES ($1, $2, CURRENT_DATE, true)
             RETURNING *`,
            [studentId, this.id]
        );

        // Update student's current batch
        await query(
            'UPDATE students SET current_batch_id = $1 WHERE id = $2',
            [this.id, studentId]
        );

        // Update strength
        this.strength = await this.getStudentCount();
        await this.save();

        return result.rows[0];
    }

    async removeStudent(studentId) {
        const result = await query(
            'UPDATE batch_students SET is_current = false, left_at = CURRENT_DATE WHERE student_id = $1 AND batch_id = $2 AND is_current = true RETURNING *',
            [studentId, this.id]
        );

        if (result.rows.length > 0) {
            // Update student's current batch
            await query(
                'UPDATE students SET current_batch_id = NULL WHERE id = $1 AND current_batch_id = $2',
                [studentId, this.id]
            );

            // Update strength
            this.strength = await this.getStudentCount();
            await this.save();
        }

        return result.rows[0] || null;
    }

    // ============================================
    // HELPERS
    // ============================================
    toJSON() {
        return { ...this };
    }
}

module.exports = Batch;