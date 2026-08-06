// ============================================
// ANALYTICS MODEL
// ============================================

const { query } = require('../config/database');
const { QUADRANTS } = require('../utils/constants');

class Analytics {
    constructor(data = {}) {
        this.id = data.id;
        this.student_id = data.student_id;
        this.attempt_id = data.attempt_id;
        this.test_id = data.test_id;
        this.batch_id = data.batch_id;
        this.all_india_rank = data.all_india_rank;
        this.all_india_percentile = data.all_india_percentile;
        this.batch_rank = data.batch_rank;
        this.batch_percentile = data.batch_percentile;
        this.total_score = data.total_score;
        this.total_marks = data.total_marks;
        this.subject_wise_scores = data.subject_wise_scores || {};
        this.subject_wise_accuracy = data.subject_wise_accuracy || {};
        this.time_per_question = data.time_per_question || {};
        this.average_time_per_question = data.average_time_per_question;
        this.overall_accuracy = data.overall_accuracy;
        this.speed_accuracy_quadrant = data.speed_accuracy_quadrant;
        this.incorrect_question_ids = data.incorrect_question_ids || [];
        this.topper_id = data.topper_id;
        this.topper_score = data.topper_score;
        this.calculated_at = data.calculated_at;
        this.created_at = data.created_at;
    }

    // ============================================
    // STATIC METHODS
    // ============================================
    static async findByAttemptId(attemptId) {
        const result = await query(
            'SELECT * FROM analytics WHERE attempt_id = $1',
            [attemptId]
        );
        return result.rows[0] ? new Analytics(result.rows[0]) : null;
    }

    static async findByStudentId(studentId, options = {}) {
        const { limit = 10, offset = 0 } = options;
        const result = await query(
            `SELECT * FROM analytics 
             WHERE student_id = $1
             ORDER BY calculated_at DESC
             LIMIT $2 OFFSET $3`,
            [studentId, limit, offset]
        );
        return result.rows.map(row => new Analytics(row));
    }

    static async getStudentStats(studentId) {
        const result = await query(
            `SELECT 
                COUNT(*) as total_attempts,
                AVG(total_score) as avg_score,
                AVG(overall_accuracy) as avg_accuracy,
                MAX(total_score) as highest_score,
                MIN(total_score) as lowest_score
             FROM analytics
             WHERE student_id = $1`,
            [studentId]
        );
        return result.rows[0] || {};
    }

    static async getBatchStats(batchId) {
        const result = await query(
            `SELECT 
                COUNT(DISTINCT student_id) as student_count,
                AVG(total_score) as avg_score,
                AVG(overall_accuracy) as avg_accuracy,
                MAX(total_score) as highest_score
             FROM analytics
             WHERE batch_id = $1`,
            [batchId]
        );
        return result.rows[0] || {};
    }

    // ============================================
    // INSTANCE METHODS
    // ============================================
    async save() {
        if (this.id) {
            const result = await query(
                `UPDATE analytics SET
                    all_india_rank = $1,
                    all_india_percentile = $2,
                    batch_rank = $3,
                    batch_percentile = $4,
                    total_score = $5,
                    total_marks = $6,
                    subject_wise_scores = $7,
                    subject_wise_accuracy = $8,
                    time_per_question = $9,
                    average_time_per_question = $10,
                    overall_accuracy = $11,
                    speed_accuracy_quadrant = $12,
                    incorrect_question_ids = $13,
                    topper_id = $14,
                    topper_score = $15,
                    calculated_at = CURRENT_TIMESTAMP
                 WHERE id = $16
                 RETURNING *`,
                [this.all_india_rank, this.all_india_percentile,
                 this.batch_rank, this.batch_percentile,
                 this.total_score, this.total_marks,
                 this.subject_wise_scores, this.subject_wise_accuracy,
                 this.time_per_question, this.average_time_per_question,
                 this.overall_accuracy, this.speed_accuracy_quadrant,
                 this.incorrect_question_ids, this.topper_id,
                 this.topper_score, this.id]
            );
            if (result.rows.length === 0) return null;
            Object.assign(this, result.rows[0]);
            return this;
        } else {
            const result = await query(
                `INSERT INTO analytics (
                    student_id, attempt_id, test_id, batch_id,
                    all_india_rank, all_india_percentile,
                    batch_rank, batch_percentile,
                    total_score, total_marks,
                    subject_wise_scores, subject_wise_accuracy,
                    time_per_question, average_time_per_question,
                    overall_accuracy, speed_accuracy_quadrant,
                    incorrect_question_ids, topper_id, topper_score,
                    calculated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP)
                RETURNING *`,
                [this.student_id, this.attempt_id, this.test_id,
                 this.batch_id, this.all_india_rank,
                 this.all_india_percentile, this.batch_rank,
                 this.batch_percentile, this.total_score,
                 this.total_marks, this.subject_wise_scores,
                 this.subject_wise_accuracy, this.time_per_question,
                 this.average_time_per_question, this.overall_accuracy,
                 this.speed_accuracy_quadrant,
                 this.incorrect_question_ids, this.topper_id,
                 this.topper_score]
            );
            Object.assign(this, result.rows[0]);
            return this;
        }
    }

    async calculateQuadrant(speedPercentile, accuracy) {
        const avgSpeed = 50;
        const avgAccuracy = 70;

        if (speedPercentile >= avgSpeed && accuracy >= avgAccuracy) {
            this.speed_accuracy_quadrant = QUADRANTS.FAST_ACCURATE;
        } else if (speedPercentile >= avgSpeed && accuracy < avgAccuracy) {
            this.speed_accuracy_quadrant = QUADRANTS.FAST_INACCURATE;
        } else if (speedPercentile < avgSpeed && accuracy >= avgAccuracy) {
            this.speed_accuracy_quadrant = QUADRANTS.SLOW_ACCURATE;
        } else {
            this.speed_accuracy_quadrant = QUADRANTS.SLOW_INACCURATE;
        }
        return this.speed_accuracy_quadrant;
    }

    // ============================================
    // HELPERS
    // ============================================
    toJSON() {
        return { ...this };
    }
}

module.exports = Analytics;