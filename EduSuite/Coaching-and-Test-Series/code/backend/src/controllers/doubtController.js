// ============================================
// DOUBT CONTROLLER
// ============================================

const { pool } = require('../config/database');
const { logger } = require('../config/logger');

// ============================================
// CREATE DOUBT
// ============================================
const createDoubt = async (req, res, next) => {
    try {
        const { subject, title, description, file_url, question_id } = req.body;
        const userId = req.userId;

        if (!subject || !title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Subject, title, and description are required'
            });
        }

        const studentResult = await pool.query(
            'SELECT id FROM students WHERE user_id = $1',
            [userId]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        const student_id = studentResult.rows[0].id;
        const slaAcknowledge = new Date();
        slaAcknowledge.setHours(slaAcknowledge.getHours() + 1);
        const slaResolve = new Date();
        slaResolve.setHours(slaResolve.getHours() + 24);

        const result = await pool.query(
            `INSERT INTO doubts (
                student_id, subject, title, description, file_url, question_id,
                sla_acknowledge_deadline, sla_resolve_deadline,
                status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP)
            RETURNING *`,
            [student_id, subject, title, description, file_url, question_id,
             slaAcknowledge, slaResolve]
        );

        logger.info(`Doubt created: ${title} by student ${student_id}`);

        res.status(201).json({
            success: true,
            message: 'Doubt created successfully',
            data: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// GET DOUBT QUEUE
// ============================================
const getDoubtQueue = async (req, res, next) => {
    try {
        const { status, assigned_to_me = false } = req.query;

        let query = `
            SELECT d.*, 
                   s.student_code,
                   u.first_name || ' ' || u.last_name as student_name,
                   u.email as student_email,
                   f2.first_name || ' ' || f2.last_name as assigned_to_name
            FROM doubts d
            JOIN students s ON d.student_id = s.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN faculty f ON d.assigned_to = f.id
            LEFT JOIN users f2 ON f.user_id = f2.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND d.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (assigned_to_me === 'true') {
            const facultyResult = await pool.query(
                'SELECT id FROM faculty WHERE user_id = $1',
                [req.userId]
            );
            if (facultyResult.rows.length > 0) {
                query += ` AND d.assigned_to = $${paramIndex}`;
                params.push(facultyResult.rows[0].id);
                paramIndex++;
            }
        }

        query += ` ORDER BY d.sla_resolve_deadline ASC, d.created_at ASC`;

        const result = await pool.query(query, params);

        // Check SLA breaches
        const now = new Date();
        for (const doubt of result.rows) {
            const resolveDeadline = new Date(doubt.sla_resolve_deadline);
            if (!doubt.sla_breached && resolveDeadline < now && doubt.status !== 'resolved') {
                await pool.query(
                    'UPDATE doubts SET sla_breached = true WHERE id = $1',
                    [doubt.id]
                );
                doubt.sla_breached = true;
            }
        }

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// ASSIGN DOUBT
// ============================================
const assignDoubt = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { faculty_id } = req.body;

        const result = await pool.query(
            `UPDATE doubts SET
                assigned_to = $1,
                assigned_at = CURRENT_TIMESTAMP,
                acknowledged_at = CURRENT_TIMESTAMP,
                status = 'assigned',
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND status = 'pending'
             RETURNING *`,
            [faculty_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Doubt not found or already assigned'
            });
        }

        logger.info(`Doubt assigned: ${id} to faculty ${faculty_id}`);

        res.json({
            success: true,
            message: 'Doubt assigned successfully',
            data: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// RESOLVE DOUBT
// ============================================
const resolveDoubt = async (req, res, next) => {
    try {
        const { id } = req.params;

        const facultyResult = await pool.query(
            'SELECT id FROM faculty WHERE user_id = $1',
            [req.userId]
        );

        if (facultyResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        const faculty_id = facultyResult.rows[0].id;

        const result = await pool.query(
            `UPDATE doubts SET
                status = 'resolved',
                resolved_by = $1,
                resolved_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND status IN ('assigned', 'pending')
             RETURNING *`,
            [faculty_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Doubt not found or already resolved'
            });
        }

        logger.info(`Doubt resolved: ${id} by faculty ${faculty_id}`);

        res.json({
            success: true,
            message: 'Doubt resolved successfully',
            data: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// RATE DOUBT
// ============================================
const rateDoubt = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const result = await pool.query(
            `UPDATE doubts SET
                resolution_rating = $1,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND status = 'resolved'
             RETURNING *`,
            [rating, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Doubt not found or not resolved'
            });
        }

        // Update faculty rating
        if (result.rows[0].resolved_by) {
            await pool.query(
                `UPDATE faculty SET rating = (
                    SELECT AVG(resolution_rating) 
                    FROM doubts 
                    WHERE resolved_by = $1 AND resolution_rating IS NOT NULL
                ) WHERE id = $1`,
                [result.rows[0].resolved_by]
            );
        }

        logger.info(`Doubt rated: ${id} with rating ${rating}`);

        res.json({
            success: true,
            message: 'Rating submitted successfully',
            data: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// GET SLA STATS
// ============================================
const getSLAStats = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total_doubts,
                COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
                COUNT(CASE WHEN sla_breached = true THEN 1 END) as breached,
                AVG(EXTRACT(EPOCH FROM (resolved_at - assigned_at))/3600) as avg_resolution_hours
             FROM doubts`
        );

        const facultyResult = await pool.query(
            `SELECT 
                f.id,
                u.first_name || ' ' || u.last_name as faculty_name,
                COUNT(d.id) as doubts_resolved,
                AVG(d.resolution_rating) as avg_rating,
                AVG(EXTRACT(EPOCH FROM (d.resolved_at - d.assigned_at))/3600) as avg_time_hours
             FROM faculty f
             JOIN users u ON f.user_id = u.id
             LEFT JOIN doubts d ON d.resolved_by = f.id
             GROUP BY f.id, u.first_name, u.last_name
             ORDER BY avg_rating DESC`
        );

        res.json({
            success: true,
            data: {
                overview: result.rows[0] || {},
                facultyPerformance: facultyResult.rows || []
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createDoubt,
    getDoubtQueue,
    assignDoubt,
    resolveDoubt,
    rateDoubt,
    getSLAStats
};