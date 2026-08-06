// ============================================
// DPP MODEL
// ============================================

const { query } = require('../config/database');
const { DPP_STATUS } = require('../utils/constants');

class DPP {
    constructor(data = {}) {
        this.id = data.id;
        this.student_id = data.student_id;
        this.for_date = data.for_date;
        this.questions = data.questions || [];
        this.status = data.status || DPP_STATUS.PENDING;
        this.streak_count = data.streak_count || 0;
        this.last_submitted_at = data.last_submitted_at;
        this.submitted_at = data.submitted_at;
        this.answers = data.answers || {};
        this.score_obtained = data.score_obtained;
        this.total_correct = data.total_correct || 0;
        this.total_incorrect = data.total_incorrect || 0;
        this.time_taken_seconds = data.time_taken_seconds;
        this.generated_by = data.generated_by || 'auto';
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ============================================
    // STATIC METHODS
    // ============================================
    static async findById(id) {
        const result = await query(
            'SELECT * FROM dpps WHERE id = $1',
            [id]
        );
        return result.rows[0] ? new DPP(result.rows[0]) : null;
    }

    static async findByStudent(studentId, options = {}) {
        const { limit = 10, offset = 0, status } = options;
        let queryText = 'SELECT * FROM dpps WHERE student_id = $1';
        const params = [studentId];
        let paramIndex = 2;

        if (status) {
            queryText += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        queryText += ` ORDER BY for_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows.map(row => new DPP(row));
    }

    static async getTodayDPP(studentId) {
        const result = await query(
            'SELECT * FROM dpps WHERE student_id = $1 AND for_date = CURRENT_DATE LIMIT 1',
            [studentId]
        );
        return result.rows[0] ? new DPP(result.rows[0]) : null;
    }

    static async getStreak(studentId) {
        const result = await query(
            `SELECT 
                streak_count,
                MAX(for_date) as last_submission_date,
                COUNT(*) as total_submissions
             FROM dpps
             WHERE student_id = $1 AND status = 'submitted'
             GROUP BY streak_count
             ORDER BY streak_count DESC
             LIMIT 1`,
            [studentId]
        );
        return result.rows[0] || { currentStreak: 0 };
    }

    static async generateDPP(studentId, count = 12) {
        // Get error book questions
        const errorQuestions = await query(
            `SELECT eb.id as error_id, q.*
             FROM error_book eb
             JOIN questions q ON eb.question_id = q.id
             WHERE eb.student_id = $1 
               AND eb.is_mastered = false 
               AND eb.in_active_deck = true
             ORDER BY RANDOM()
             LIMIT $2`,
            [studentId, count]
        );

        let questionIds = errorQuestions.rows.map(q => q.id);
        let selectedQuestions = errorQuestions.rows;

        // If not enough, add random questions
        if (questionIds.length < count) {
            const remaining = count - questionIds.length;
            const extraQuestions = await query(
                `SELECT * FROM questions
                 WHERE id NOT IN (SELECT unnest($1::int[]))
                 ORDER BY RANDOM()
                 LIMIT $2`,
                [questionIds.length > 0 ? questionIds : [0], remaining]
            );
            selectedQuestions = [...selectedQuestions, ...extraQuestions.rows];
            questionIds = selectedQuestions.map(q => q.id);
        }

        // Create DPP
        const result = await query(
            `INSERT INTO dpps (student_id, for_date, questions, status, generated_by)
             VALUES ($1, CURRENT_DATE, $2, 'pending', 'auto')
             RETURNING *`,
            [studentId, JSON.stringify(questionIds)]
        );

        // Update streak
        await query(
            `UPDATE dpps SET streak_count = streak_count + 1
             WHERE student_id = $1 AND for_date = CURRENT_DATE`,
            [studentId]
        );

        const dpp = new DPP(result.rows[0]);
        dpp.questionsData = selectedQuestions;
        return dpp;
    }

    // ============================================
    // INSTANCE METHODS
    // ============================================
    async save() {
        if (this.id) {
            const result = await query(
                `UPDATE dpps SET
                    status = $1,
                    submitted_at = $2,
                    answers = $3,
                    score_obtained = $4,
                    total_correct = $5,
                    total_incorrect = $6,
                    time_taken_seconds = $7,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $8
                 RETURNING *`,
                [this.status, this.submitted_at, this.answers,
                 this.score_obtained, this.total_correct,
                 this.total_incorrect, this.time_taken_seconds, this.id]
            );
            if (result.rows.length === 0) return null;
            Object.assign(this, result.rows[0]);
            return this;
        } else {
            const result = await query(
                `INSERT INTO dpps (
                    student_id, for_date, questions, status,
                    streak_count, generated_by
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [this.student_id, this.for_date || new Date(),
                 this.questions, this.status,
                 this.streak_count, this.generated_by]
            );
            Object.assign(this, result.rows[0]);
            return this;
        }
    }

    async submit(answers) {
        const questionIds = this.questions;
        let totalCorrect = 0;
        let totalIncorrect = 0;
        const evaluatedAnswers = {};

        for (const qId of questionIds) {
            const questionResult = await query(
                'SELECT correct_answers FROM questions WHERE id = $1',
                [qId]
            );
            if (questionResult.rows.length > 0) {
                const correct = questionResult.rows[0].correct_answers;
                const userAnswer = answers[qId];
                const isCorrect = userAnswer && 
                    JSON.stringify(userAnswer) === JSON.stringify(correct);
                if (isCorrect) {
                    totalCorrect++;
                } else {
                    totalIncorrect++;
                }
                evaluatedAnswers[qId] = {
                    selected: userAnswer || null,
                    correct: isCorrect,
                    correct_answer: correct
                };
            }
        }

        const score = (totalCorrect / (totalCorrect + totalIncorrect)) * 100;

        this.status = DPP_STATUS.SUBMITTED;
        this.submitted_at = new Date();
        this.answers = evaluatedAnswers;
        this.score_obtained = score;
        this.total_correct = totalCorrect;
        this.total_incorrect = totalIncorrect;
        this.last_submitted_at = new Date();

        return await this.save();
    }

    // ============================================
    // HELPERS
    // ============================================
    toJSON() {
        return { ...this };
    }
}

module.exports = DPP;