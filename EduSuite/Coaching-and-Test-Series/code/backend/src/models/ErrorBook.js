// ============================================
// ERROR BOOK MODEL
// ============================================

const { query } = require('../config/database');

class ErrorBook {
    constructor(data = {}) {
        this.id = data.id;
        this.student_id = data.student_id;
        this.question_id = data.question_id;
        this.attempt_id = data.attempt_id;
        this.added_at = data.added_at;
        this.in_active_deck = data.in_active_deck !== undefined ? data.in_active_deck : true;
        this.removed_from_deck_at = data.removed_from_deck_at;
        this.attempted_count = data.attempted_count || 0;
        this.correct_count = data.correct_count || 0;
        this.last_attempted_at = data.last_attempted_at;
        this.is_mastered = data.is_mastered || false;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ============================================
    // STATIC METHODS
    // ============================================
    static async findById(id) {
        const result = await query(
            'SELECT * FROM error_book WHERE id = $1',
            [id]
        );
        return result.rows[0] ? new ErrorBook(result.rows[0]) : null;
    }

    static async findByStudent(studentId, options = {}) {
        const { limit = 50, offset = 0, in_active_deck, subject } = options;
        let queryText = `
            SELECT eb.*, q.question_text, q.subject, q.chapter, q.difficulty,
                   q.options, q.correct_answers, q.explanation
            FROM error_book eb
            JOIN questions q ON eb.question_id = q.id
            WHERE eb.student_id = $1
        `;
        const params = [studentId];
        let paramIndex = 2;

        if (in_active_deck !== undefined) {
            queryText += ` AND eb.in_active_deck = $${paramIndex}`;
            params.push(in_active_deck);
            paramIndex++;
        }

        if (subject) {
            queryText += ` AND q.subject = $${paramIndex}`;
            params.push(subject);
            paramIndex++;
        }

        queryText += ` ORDER BY eb.added_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows.map(row => new ErrorBook(row));
    }

    static async getStats(studentId) {
        const result = await query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN is_mastered = true THEN 1 END) as mastered,
                COUNT(CASE WHEN is_mastered = false AND in_active_deck = true THEN 1 END) as in_progress
             FROM error_book
             WHERE student_id = $1`,
            [studentId]
        );
        return result.rows[0] || { total: 0, mastered: 0, in_progress: 0 };
    }

    // ============================================
    // INSTANCE METHODS
    // ============================================
    async save() {
        if (this.id) {
            const result = await query(
                `UPDATE error_book SET
                    in_active_deck = $1,
                    removed_from_deck_at = $2,
                    attempted_count = $3,
                    correct_count = $4,
                    last_attempted_at = $5,
                    is_mastered = $6,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $7
                 RETURNING *`,
                [this.in_active_deck, this.removed_from_deck_at,
                 this.attempted_count, this.correct_count,
                 this.last_attempted_at, this.is_mastered, this.id]
            );
            if (result.rows.length === 0) return null;
            Object.assign(this, result.rows[0]);
            return this;
        } else {
            const result = await query(
                `INSERT INTO error_book (
                    student_id, question_id, attempt_id,
                    added_at, in_active_deck, is_mastered
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [this.student_id, this.question_id, this.attempt_id,
                 this.added_at || new Date(),
                 this.in_active_deck, this.is_mastered]
            );
            Object.assign(this, result.rows[0]);
            return this;
        }
    }

    async markMastered() {
        this.is_mastered = true;
        this.in_active_deck = false;
        this.removed_from_deck_at = new Date();
        return await this.save();
    }

    async removeFromDeck() {
        this.in_active_deck = false;
        this.removed_from_deck_at = new Date();
        return await this.save();
    }

    async addAttempt(isCorrect) {
        this.attempted_count += 1;
        if (isCorrect) {
            this.correct_count += 1;
            this.last_attempted_at = new Date();
            if (this.correct_count >= 3) {
                await this.markMastered();
            }
        }
        return await this.save();
    }

    // ============================================
    // HELPERS
    // ============================================
    toJSON() {
        return { ...this };
    }
}

module.exports = ErrorBook;