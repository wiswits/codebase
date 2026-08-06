// ============================================
// STUDENT CONTROLLER
// ============================================

const { pool, query } = require('../config/database');
const { logger } = require('../config/logger');

// ============================================
// GET ALL STUDENTS
// ============================================
const getAllStudents = async (req, res, next) => {
    try {
        const { batch, status, search, limit = 50, offset = 0 } = req.query;

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

        if (batch) {
            queryText += ` AND s.current_batch_id = $${paramIndex}`;
            params.push(batch);
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

        const result = await pool.query(queryText, params);
        const countResult = await pool.query('SELECT COUNT(*) FROM students');

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// GET STUDENT BY ID
// ============================================
const getStudentById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT s.*, u.email, u.first_name, u.last_name, u.phone,
                    b.name as batch_name, b.type as batch_type
             FROM students s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN batches b ON s.current_batch_id = b.id
             WHERE s.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// GET STUDENT PROFILE
// ============================================
const getStudentProfile = async (req, res, next) => {
    try {
        const userId = req.userId;

        const result = await pool.query(
            `SELECT s.*, u.email, u.first_name, u.last_name, u.phone,
                    b.name as batch_name, b.type as batch_type
             FROM students s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN batches b ON s.current_batch_id = b.id
             WHERE s.user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// UPDATE STUDENT
// ============================================
const updateStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            dob, gender, address, parent_name, parent_phone,
            parent_email, target_exam, current_batch_id, status
        } = req.body;

        const result = await pool.query(
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
            [dob, gender, address, parent_name, parent_phone,
             parent_email, target_exam, current_batch_id, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        logger.info(`Student updated: ${id}`);

        res.json({
            success: true,
            message: 'Student updated successfully',
            data: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// GET STUDENT ATTEMPTS
// ============================================
const getStudentAttempts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const result = await pool.query(
            `SELECT a.*, t.title as test_title, t.type as test_type,
                    t.total_marks, t.duration_minutes
             FROM attempts a
             JOIN tests t ON a.test_id = t.id
             WHERE a.student_id = $1
             ORDER BY a.created_at DESC
             LIMIT $2 OFFSET $3`,
            [id, limit, offset]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM attempts WHERE student_id = $1',
            [id]
        );

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// GET STUDENT ANALYTICS
// ============================================
const getStudentAnalytics = async (req, res, next) => {
    try {
        const { id } = req.params;

        const statsResult = await pool.query(
            `SELECT 
                COUNT(*) as total_attempts,
                AVG(score_obtained) as avg_score,
                AVG(overall_accuracy) as avg_accuracy,
                MAX(score_obtained) as highest_score
             FROM analytics
             WHERE student_id = $1`,
            [id]
        );

        const rankResult = await pool.query(
            `SELECT all_india_rank, batch_rank, all_india_percentile
             FROM analytics
             WHERE student_id = $1
             ORDER BY calculated_at DESC
             LIMIT 1`,
            [id]
        );

        const subjectResult = await pool.query(
            `SELECT 
                key as subject,
                AVG(value::numeric) as avg_score
             FROM analytics,
             jsonb_each_text(subject_wise_scores)
             WHERE student_id = $1
             GROUP BY key`,
            [id]
        );

        res.json({
            success: true,
            data: {
                stats: statsResult.rows[0] || {},
                currentRank: rankResult.rows[0] || null,
                subjectPerformance: subjectResult.rows || []
            }
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// STUDENT WIDGET - Returns summary for dashboard
// ============================================
const getStudentWidget = async (req, res, next) => {
    try {
        // 1. Get total students count
        const totalResult = await pool.query('SELECT COUNT(*) FROM students');
        
        // 2. Get active students count
        const activeResult = await pool.query(
            "SELECT COUNT(*) FROM students WHERE status = 'active'"
        );
        
        // 3. Get new students this month
        const newResult = await pool.query(
            "SELECT COUNT(*) FROM students WHERE enrollment_date >= CURRENT_DATE - INTERVAL '30 days'"
        );

        // 4. Get recent students (for the list)
        const recentResult = await pool.query(
            `SELECT s.student_code, u.first_name, u.last_name, s.status
             FROM students s
             JOIN users u ON s.user_id = u.id
             ORDER BY s.created_at DESC
             LIMIT 5`
        );

        // 5. Send the response in the required format
        res.json({
            success: true,
            data: {
                title: 'Students',
                numbers: {
                    total: parseInt(totalResult.rows[0].count),
                    active: parseInt(activeResult.rows[0].count),
                    new_this_month: parseInt(newResult.rows[0].count)
                },
                list: recentResult.rows.map(row => ({
                    name: `${row.first_name} ${row.last_name}`,
                    code: row.student_code,
                    status: row.status
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllStudents,
    getStudentById,
    getStudentProfile,
    updateStudent,
    getStudentAttempts,
    getStudentAnalytics
};