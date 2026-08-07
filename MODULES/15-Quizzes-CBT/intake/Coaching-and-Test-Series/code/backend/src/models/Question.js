// ============================================
// QUESTION MODEL
// ============================================

const { query } = require('../config/database');
const { QUESTION_TYPES, DIFFICULTY } = require('../utils/constants');

class Question {
    constructor(data = {}) {
        this.id = data.id;
        this.question_text = data.question_text;
        this.question_type = data.question_type || QUESTION_TYPES.MCQ;
        this.options = data.options || {};
        this.correct_answers = data.correct_answers || [];
        this.subject = data.subject;
        this.chapter = data.chapter;
        this.topic = data.topic;
        this.difficulty = data.difficulty || DIFFICULTY.MEDIUM;
        this.marks = data.marks || 4;
        this.negative_marks = data.negative_marks || 1;
        this.year_tag = data.year_tag;
        this.exam_tag = data.exam_tag;
        this.is_pyq = data.is_pyq || false;
        this.explanation = data.explanation;
        this.image_url = data.image_url;
        this.created_by = data.created_by;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ============================================
    // STATIC METHODS
    // ============================================
    static async findById(id) {
        const result = await query(
            'SELECT * FROM questions WHERE id = $1',
            [id]
        );
        return result.rows[0] ? new Question(result.rows[0]) : null;
    }

    static async findAll(options = {}) {
        const { limit = 50, offset = 0, subject, chapter, difficulty, exam_tag, year_tag, is_pyq } = options;
        let queryText = 'SELECT * FROM questions WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (subject) {
            queryText += ` AND subject = $${paramIndex}`;
            params.push(subject);
            paramIndex++;
        }

        if (chapter) {
            queryText += ` AND chapter = $${paramIndex}`;
            params.push(chapter);
            paramIndex++;
        }

        if (difficulty) {
            queryText += ` AND difficulty = $${paramIndex}`;
            params.push(difficulty);
            paramIndex++;
        }

        if (exam_tag) {
            queryText += ` AND exam_tag = $${paramIndex}`;
            params.push(exam_tag);
            paramIndex++;
        }

        if (year_tag) {
            queryText += ` AND year_tag = $${paramIndex}`;
            params.push(year_tag);
            paramIndex++;
        }

        if (is_pyq !== undefined) {
            queryText += ` AND is_pyq = $${paramIndex}`;
            params.push(is_pyq);
            paramIndex++;
        }

        queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows.map(row => new Question(row));
    }

    static async findPYQs(options = {}) {
        const { exam_tag, year_tag, limit = 50, offset = 0 } = options;
        let queryText = 'SELECT * FROM questions WHERE is_pyq = true';
        const params = [];
        let paramIndex = 1;

        if (exam_tag) {
            queryText += ` AND exam_tag = $${paramIndex}`;
            params.push(exam_tag);
            paramIndex++;
        }

        if (year_tag) {
            queryText += ` AND year_tag = $${paramIndex}`;
            params.push(year_tag);
            paramIndex++;
        }

        queryText += ` ORDER BY year_tag DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows.map(row => new Question(row));
    }

    // ============================================
    // INSTANCE METHODS
    // ============================================
    async save() {
        if (this.id) {
            const result = await query(
                `UPDATE questions SET
                    question_text = $1,
                    question_type = $2,
                    options = $3,
                    correct_answers = $4,
                    subject = $5,
                    chapter = $6,
                    topic = $7,
                    difficulty = $8,
                    marks = $9,
                    negative_marks = $10,
                    year_tag = $11,
                    exam_tag = $12,
                    is_pyq = $13,
                    explanation = $14,
                    image_url = $15,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $16
                 RETURNING *`,
                [this.question_text, this.question_type, this.options,
                 this.correct_answers, this.subject, this.chapter,
                 this.topic, this.difficulty, this.marks,
                 this.negative_marks, this.year_tag, this.exam_tag,
                 this.is_pyq, this.explanation, this.image_url, this.id]
            );
            if (result.rows.length === 0) return null;
            Object.assign(this, result.rows[0]);
            return this;
        } else {
            const result = await query(
                `INSERT INTO questions (
                    question_text, question_type, options, correct_answers,
                    subject, chapter, topic, difficulty, marks, negative_marks,
                    year_tag, exam_tag, is_pyq, explanation, image_url, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *`,
                [this.question_text, this.question_type, this.options,
                 this.correct_answers, this.subject, this.chapter,
                 this.topic, this.difficulty, this.marks,
                 this.negative_marks, this.year_tag, this.exam_tag,
                 this.is_pyq, this.explanation, this.image_url, this.created_by]
            );
            Object.assign(this, result.rows[0]);
            return this;
        }
    }

    // ============================================
    // HELPERS
    // ============================================
    toJSON() {
        return { ...this };
    }
}

module.exports = Question;