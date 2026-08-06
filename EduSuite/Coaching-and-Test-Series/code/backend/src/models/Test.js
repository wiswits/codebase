// ============================================
// TEST MODEL
// ============================================

const { query, transaction } = require('../config/database');
const { TEST_TYPES, TEST_MODES } = require('../utils/constants');

class Test {
    constructor(data = {}) {
        this.id = data.id;
        this.title = data.title;
        this.type = data.type || TEST_TYPES.PART_SYLLABUS;
        this.mode = data.mode || TEST_MODES.ONLINE;
        this.duration_minutes = data.duration_minutes;
        this.total_marks = data.total_marks || 0;
        this.total_questions = data.total_questions || 0;
        this.marking_scheme = data.marking_scheme || { correct: 4, incorrect: -1, unattempted: 0 };
        this.subjects = data.subjects || [];
        this.syllabus = data.syllabus;
        this.instructions = data.instructions;
        this.scheduled_at = data.scheduled_at;
        this.batch_id = data.batch_id;
        this.created_by = data.created_by;
        this.is_published = data.is_published || false;
        this.published_at = data.published_at;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ============================================
    // STATIC METHODS
    // ============================================
    static async findById(id) {
        const result = await query(
            `SELECT t.*, b.name as batch_name,
                    u.first_name || ' ' || u.last_name as created_by_name,
                    (SELECT COUNT(*) FROM test_questions WHERE test_id = t.id) as question_count
             FROM tests t
             LEFT JOIN batches b ON t.batch_id = b.id
             LEFT JOIN users u ON t.created_by = u.id
             WHERE t.id = $1`,
            [id]
        );
        return result.rows[0] ? new Test(result.rows[0]) : null;
    }

    static async findAll(options = {}) {
        const { limit = 50, offset = 0, type, batch_id, is_published } = options;
        let queryText = `
            SELECT t.*, b.name as batch_name,
                   u.first_name || ' ' || u.last_name as created_by_name
            FROM tests t
            LEFT JOIN batches b ON t.batch_id = b.id
            LEFT JOIN users u ON t.created_by = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (type) {
            queryText += ` AND t.type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (batch_id) {
            queryText += ` AND t.batch_id = $${paramIndex}`;
            params.push(batch_id);
            paramIndex++;
        }

        if (is_published !== undefined) {
            queryText += ` AND t.is_published = $${paramIndex}`;
            params.push(is_published);
            paramIndex++;
        }

        queryText += ` ORDER BY t.scheduled_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows.map(row => new Test(row));
    }

    // ============================================
    // INSTANCE METHODS
    // ============================================
    async save() {
        if (this.id) {
            const result = await query(
                `UPDATE tests SET
                    title = $1,
                    type = $2,
                    mode = $3,
                    duration_minutes = $4,
                    total_marks = $5,
                    marking_scheme = $6,
                    subjects = $7,
                    syllabus = $8,
                    instructions = $9,
                    scheduled_at = $10,
                    batch_id = $11,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $12
                 RETURNING *`,
                [this.title, this.type, this.mode, this.duration_minutes,
                 this.total_marks, this.marking_scheme, this.subjects,
                 this.syllabus, this.instructions, this.scheduled_at,
                 this.batch_id, this.id]
            );
            if (result.rows.length === 0) return null;
            Object.assign(this, result.rows[0]);
            return this;
        } else {
            const result = await query(
                `INSERT INTO tests (
                    title, type, mode, duration_minutes, total_marks,
                    marking_scheme, subjects, syllabus, instructions,
                    scheduled_at, batch_id, created_by, is_published
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *`,
                [this.title, this.type, this.mode, this.duration_minutes,
                 this.total_marks, this.marking_scheme, this.subjects,
                 this.syllabus, this.instructions, this.scheduled_at,
                 this.batch_id, this.created_by, this.is_published]
            );
            Object.assign(this, result.rows[0]);
            return this;
        }
    }

    async publish() {
        const result = await query(
            `UPDATE tests SET
                is_published = true,
                published_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND is_published = false
             RETURNING *`,
            [this.id]
        );
        if (result.rows.length === 0) return null;
        Object.assign(this, result.rows[0]);
        return this;
    }

    async getQuestions() {
        const result = await query(
            `SELECT q.*, tq.question_order, tq.marks as custom_marks
             FROM test_questions tq
             JOIN questions q ON tq.question_id = q.id
             WHERE tq.test_id = $1
             ORDER BY tq.question_order`,
            [this.id]
        );
        return result.rows;
    }

    async addQuestions(questionIds) {
        return await transaction(async (client) => {
            const values = questionIds.map((qId, index) => {
                return `($1, $${index + 2}, ${index})`;
            }).join(',');

            const flatParams = [this.id, ...questionIds];
            await client.query(
                `INSERT INTO test_questions (test_id, question_id, question_order)
                 VALUES ${values}`,
                flatParams
            );

            // Update total questions
            this.total_questions = await this.getQuestionCount();
            await this.save();

            return true;
        });
    }

    async getQuestionCount() {
        const result = await query(
            'SELECT COUNT(*) FROM test_questions WHERE test_id = $1',
            [this.id]
        );
        return parseInt(result.rows[0].count);
    }

    async getAttempts() {
        const result = await query(
            `SELECT a.*, s.student_code, u.first_name, u.last_name
             FROM attempts a
             JOIN students s ON a.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE a.test_id = $1
             ORDER BY a.created_at DESC`,
            [this.id]
        );
        return result.rows;
    }

    // ============================================
    // HELPERS
    // ============================================
    toJSON() {
        return { ...this };
    }
}

module.exports = Test;