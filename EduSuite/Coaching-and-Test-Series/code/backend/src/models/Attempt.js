// ============================================
// ATTEMPT MODEL
// ============================================

const { query, transaction } = require('../config/database');
const { ATTEMPT_STATUS } = require('../utils/constants');

class Attempt {
    constructor(data = {}) {
        this.id = data.id;
        this.student_id = data.student_id;
        this.test_id = data.test_id;
        this.status = data.status || ATTEMPT_STATUS.IN_PROGRESS;
        this.start_time = data.start_time;
        this.end_time = data.end_time;
        this.submitted_at = data.submitted_at;
        this.time_taken_seconds = data.time_taken_seconds;
        this.omr_file_path = data.omr_file_path;
        this.omr_processed = data.omr_processed || false;
        this.raw_answers = data.raw_answers || {};
        this.evaluated_answers = data.evaluated_answers || {};
        this.score_obtained = data.score_obtained;
        this.total_correct = data.total_correct || 0;
        this.total_incorrect = data.total_incorrect || 0;
        this.total_unattempted = data.total_unattempted || 0;
        this.device_info = data.device_info || {};
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ============================================
    // STATIC METHODS
    // ============================================
    static async findById(id) {
        const result = await query(
            'SELECT * FROM attempts WHERE id = $1',
            [id]
        );
        return result.rows[0] ? new Attempt(result.rows[0]) : null;
    }

    static async findByStudentAndTest(studentId, testId) {
        const result = await query(
            'SELECT * FROM attempts WHERE student_id = $1 AND test_id = $2',
            [studentId, testId]
        );
        return result.rows[0] ? new Attempt(result.rows[0]) : null;
    }

    static async findAll(options = {}) {
        const { limit = 50, offset = 0, student_id, test_id, status } = options;
        let queryText = 'SELECT * FROM attempts WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (student_id) {
            queryText += ` AND student_id = $${paramIndex}`;
            params.push(student_id);
            paramIndex++;
        }

        if (test_id) {
            queryText += ` AND test_id = $${paramIndex}`;
            params.push(test_id);
            paramIndex++;
        }

        if (status) {
            queryText += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows.map(row => new Attempt(row));
    }

    // ============================================
    // INSTANCE METHODS
    // ============================================
    async save() {
        if (this.id) {
            const result = await query(
                `UPDATE attempts SET
                    status = $1,
                    end_time = $2,
                    submitted_at = $3,
                    time_taken_seconds = $4,
                    omr_file_path = $5,
                    omr_processed = $6,
                    raw_answers = $7,
                    evaluated_answers = $8,
                    score_obtained = $9,
                    total_correct = $10,
                    total_incorrect = $11,
                    total_unattempted = $12,
                    device_info = $13,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $14
                 RETURNING *`,
                [this.status, this.end_time, this.submitted_at,
                 this.time_taken_seconds, this.omr_file_path,
                 this.omr_processed, this.raw_answers,
                 this.evaluated_answers, this.score_obtained,
                 this.total_correct, this.total_incorrect,
                 this.total_unattempted, this.device_info, this.id]
            );
            if (result.rows.length === 0) return null;
            Object.assign(this, result.rows[0]);
            return this;
        } else {
            const result = await query(
                `INSERT INTO attempts (
                    student_id, test_id, status, start_time,
                    raw_answers, device_info
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [this.student_id, this.test_id, this.status,
                 this.start_time || new Date(),
                 this.raw_answers, this.device_info]
            );
            Object.assign(this, result.rows[0]);
            return this;
        }
    }

    async submit(answers) {
        return await transaction(async (client) => {
            // Get test details
            const testResult = await client.query(
                'SELECT * FROM tests WHERE id = $1',
                [this.test_id]
            );
            const test = testResult.rows[0];
            const markingScheme = test.marking_scheme || { correct: 4, incorrect: -1, unattempted: 0 };

            // Get questions
            const questionsResult = await client.query(
                `SELECT q.* FROM test_questions tq
                 JOIN questions q ON tq.question_id = q.id
                 WHERE tq.test_id = $1`,
                [this.test_id]
            );

            const questions = questionsResult.rows;
            const rawAnswers = answers || this.raw_answers || {};
            const evaluatedAnswers = {};
            let totalCorrect = 0;
            let totalIncorrect = 0;
            let totalUnattempted = 0;
            let scoreObtained = 0;
            const incorrectQuestionIds = [];

            questions.forEach(q => {
                const userAnswer = rawAnswers[q.id];
                const correctAnswers = q.correct_answers;
                const isCorrect = userAnswer && 
                    JSON.stringify(userAnswer) === JSON.stringify(correctAnswers);

                let marks = 0;
                if (userAnswer) {
                    if (isCorrect) {
                        marks = markingScheme.correct || q.marks || 4;
                        totalCorrect++;
                    } else {
                        marks = markingScheme.incorrect || q.negative_marks || -1;
                        totalIncorrect++;
                        incorrectQuestionIds.push(q.id);
                    }
                } else {
                    totalUnattempted++;
                }
                scoreObtained += marks;
                evaluatedAnswers[q.id] = {
                    selected: userAnswer || null,
                    correct: isCorrect,
                    marks: marks,
                    correct_answer: correctAnswers
                };
            });

            // Update attempt
            await client.query(
                `UPDATE attempts SET
                    status = 'submitted',
                    end_time = CURRENT_TIMESTAMP,
                    submitted_at = CURRENT_TIMESTAMP,
                    time_taken_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time))::INTEGER,
                    evaluated_answers = $1,
                    raw_answers = $2,
                    score_obtained = $3,
                    total_correct = $4,
                    total_incorrect = $5,
                    total_unattempted = $6,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $7`,
                [evaluatedAnswers, rawAnswers, scoreObtained,
                 totalCorrect, totalIncorrect, totalUnattempted, this.id]
            );

            // Create analytics
            await client.query(
                `INSERT INTO analytics (
                    student_id, attempt_id, test_id, batch_id,
                    total_score, total_marks,
                    overall_accuracy,
                    incorrect_question_ids,
                    calculated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
                [
                    this.student_id,
                    this.id,
                    this.test_id,
                    test.batch_id,
                    scoreObtained,
                    test.total_marks || 0,
                    (totalCorrect / (totalCorrect + totalIncorrect + totalUnattempted)) * 100 || 0,
                    incorrectQuestionIds
                ]
            );

            // Add to error book
            if (incorrectQuestionIds.length > 0) {
                const values = incorrectQuestionIds.map((qId, index) => {
                    return `($1, $2, $${index + 3}, CURRENT_TIMESTAMP)`;
                }).join(',');
                const params = [this.student_id, this.id, ...incorrectQuestionIds];
                await client.query(
                    `INSERT INTO error_book (student_id, attempt_id, question_id, added_at)
                     VALUES ${values}`,
                    params
                );
            }

            return {
                score_obtained: scoreObtained,
                total_correct: totalCorrect,
                total_incorrect: totalIncorrect,
                total_unattempted: totalUnattempted
            };
        });
    }

    async getAnalytics() {
        const result = await query(
            'SELECT * FROM analytics WHERE attempt_id = $1',
            [this.id]
        );
        return result.rows[0] || null;
    }

    // ============================================
    // HELPERS
    // ============================================
    toJSON() {
        return { ...this };
    }
}

module.exports = Attempt;