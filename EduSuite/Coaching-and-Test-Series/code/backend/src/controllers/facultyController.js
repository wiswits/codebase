// ============================================
// FACULTY CONTROLLER
// ============================================

const { pool } = require('../config/database');
const { logger } = require('../config/logger');

// ============================================
// GET FACULTY PROFILE
// ============================================
const getFacultyProfile = async (req, res, next) => {
    try {
        const userId = req.userId;

        const result = await pool.query(
            `SELECT f.*, u.email, u.first_name, u.last_name, u.phone
             FROM faculty f
             JOIN users u ON f.user_id = u.id
             WHERE f.user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
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
// GET FACULTY DASHBOARD STATS
// ============================================
const getDashboardStats = async (req, res, next) => {
    try {
        const userId = req.userId;

        const facultyResult = await pool.query(
            'SELECT id FROM faculty WHERE user_id = $1',
            [userId]
        );

        if (facultyResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        const facultyId = facultyResult.rows[0].id;

        const studentsResult = await pool.query(
            `SELECT COUNT(DISTINCT s.id) as count
             FROM students s
             JOIN batch_students bs ON s.id = bs.student_id
             JOIN batches b ON bs.batch_id = b.id
             WHERE b.id IN (SELECT batch_id FROM tests WHERE created_by = $1)`,
            [facultyId]
        );

        const doubtsResult = await pool.query(
            `SELECT COUNT(*) as total_resolved
             FROM doubts
             WHERE resolved_by = $1 AND status = 'resolved'`,
            [facultyId]
        );

        const testsResult = await pool.query(
            `SELECT COUNT(*) as total_tests
             FROM tests
             WHERE created_by = $1`,
            [facultyId]
        );

        const responseResult = await pool.query(
            `SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - assigned_at))/3600) as avg_hours
             FROM doubts
             WHERE resolved_by = $1 AND resolved_at IS NOT NULL`,
            [facultyId]
        );

        res.json({
            success: true,
            data: {
                students: parseInt(studentsResult.rows[0]?.count || 0),
                doubtsResolved: parseInt(doubtsResult.rows[0]?.total_resolved || 0),
                testsCreated: parseInt(testsResult.rows[0]?.total_tests || 0),
                avgResponseHours: parseFloat(responseResult.rows[0]?.avg_hours || 0)
            }
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// GET FACULTY STUDENTS
// ============================================
const getFacultyStudents = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { search, limit = 50, offset = 0 } = req.query;

        const facultyResult = await pool.query(
            'SELECT id FROM faculty WHERE user_id = $1',
            [userId]
        );

        if (facultyResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        const facultyId = facultyResult.rows[0].id;

        let query = `
            SELECT DISTINCT s.*, u.first_name, u.last_name, u.email,
                   b.name as batch_name, b.type as batch_type
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN batch_students bs ON s.id = bs.student_id
            JOIN batches b ON bs.batch_id = b.id
            WHERE b.id IN (SELECT DISTINCT batch_id FROM tests WHERE created_by = $1)
        `;
        const params = [facultyId];
        let paramIndex = 2;

        if (search) {
            query += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR s.student_code ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        const countResult = await pool.query(
            `SELECT COUNT(DISTINCT s.id) as count
             FROM students s
             JOIN batch_students bs ON s.id = bs.student_id
             JOIN batches b ON bs.batch_id = b.id
             WHERE b.id IN (SELECT DISTINCT batch_id FROM tests WHERE created_by = $1)`,
            [facultyId]
        );

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0]?.count || 0),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// GET FACULTY BATCHES
// ============================================
const getFacultyBatches = async (req, res, next) => {
    try {
        const userId = req.userId;

        const result = await pool.query(
            `SELECT DISTINCT b.*,
                (SELECT COUNT(*) FROM batch_students WHERE batch_id = b.id AND is_current = true) as student_count
             FROM batches b
             JOIN tests t ON t.batch_id = b.id
             WHERE t.created_by = (SELECT id FROM faculty WHERE user_id = $1)`,
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getFacultyProfile,
    getDashboardStats,
    getFacultyStudents,
    getFacultyBatches
};