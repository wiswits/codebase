// ============================================
// STUDENT ROUTES
// ============================================

const authMiddleware = require('../middleware/auth');


module.exports = function(pool) {
    const router = require('express').Router();
    const auth = authMiddleware(pool);

    // All routes require authentication
    router.use(auth.verifyToken);

    // ============================================
    // GET ALL STUDENTS (Admin & Faculty only)
    // ============================================
    router.get('/', auth.isFaculty, async (req, res, next) => {
        try {
            const { batch, status, search, limit = 50, offset = 0 } = req.query;

            let query = `
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
                query += ` AND s.current_batch_id = $${paramIndex}`;
                params.push(batch);
                paramIndex++;
            }

            if (status) {
                query += ` AND s.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            if (search) {
                query += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR s.student_code ILIKE $${paramIndex})`;
                params.push(`%${search}%`);
                paramIndex++;
            }

            query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await pool.query(query, params);

            // Get total count
            const countResult = await pool.query(
                'SELECT COUNT(*) FROM students s JOIN users u ON s.user_id = u.id'
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
    });

    // ============================================
    // GET STUDENT BY ID
    // ============================================
    router.get('/:id', async (req, res, next) => {
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
    });

    // ============================================
    // GET STUDENT PROFILE (For current user)
    // ============================================
    router.get('/profile/me', async (req, res, next) => {
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
    });

    // ============================================
    // UPDATE STUDENT
    // ============================================
    router.put('/:id', auth.isFaculty, async (req, res, next) => {
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

            res.json({
                success: true,
                message: 'Student updated successfully',
                data: result.rows[0]
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // GET STUDENT'S BATCH HISTORY
    // ============================================
    router.get('/:id/batch-history', async (req, res, next) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                `SELECT bh.*, 
                        from_b.name as from_batch_name,
                        to_b.name as to_batch_name,
                        u.first_name || ' ' || u.last_name as triggered_by_name
                 FROM batch_history bh
                 LEFT JOIN batches from_b ON bh.from_batch_id = from_b.id
                 LEFT JOIN batches to_b ON bh.to_batch_id = to_b.id
                 LEFT JOIN users u ON bh.triggered_by = u.id
                 WHERE bh.student_id = $1
                 ORDER BY bh.moved_at DESC`,
                [id]
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // GET STUDENT'S TEST ATTEMPTS
    // ============================================
    router.get('/:id/attempts', async (req, res, next) => {
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
    });

    // ============================================
    // GET STUDENT'S ANALYTICS
    // ============================================
    router.get('/:id/analytics', async (req, res, next) => {
        try {
            const { id } = req.params;

            // Get overall stats
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

            // Get latest rank
            const rankResult = await pool.query(
                `SELECT all_india_rank, batch_rank, all_india_percentile
                 FROM analytics
                 WHERE student_id = $1
                 ORDER BY calculated_at DESC
                 LIMIT 1`,
                [id]
            );

            // Get subject-wise performance
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
    });

    return router;
};