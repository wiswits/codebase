// ============================================
// TEST ROUTES
// ============================================

const authMiddleware = require('../middleware/auth');

module.exports = function(pool) {
    const router = require('express').Router();
    const auth = authMiddleware(pool);

    // All routes require authentication
    router.use(auth.verifyToken);

    // ============================================
    // GET ALL TESTS
    // ============================================
    router.get('/', async (req, res, next) => {
        try {
            const { type, batch_id, status, limit = 50, offset = 0 } = req.query;

            let query = `
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
                query += ` AND t.type = $${paramIndex}`;
                params.push(type);
                paramIndex++;
            }

            if (batch_id) {
                query += ` AND t.batch_id = $${paramIndex}`;
                params.push(batch_id);
                paramIndex++;
            }

            if (status === 'published') {
                query += ` AND t.is_published = true`;
            } else if (status === 'draft') {
                query += ` AND t.is_published = false`;
            }

            query += ` ORDER BY t.scheduled_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await pool.query(query, params);

            // Get total count
            const countResult = await pool.query(
                'SELECT COUNT(*) FROM tests'
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
    // CREATE TEST (Faculty only)
    // ============================================
    router.post('/', auth.isFaculty, async (req, res, next) => {
        try {
            const {
                title, type, mode, duration_minutes, total_marks,
                marking_scheme, subjects, syllabus, instructions,
                scheduled_at, batch_id, question_ids = []
            } = req.body;

            // Validation
            if (!title || !type || !mode || !duration_minutes) {
                return res.status(400).json({
                    success: false,
                    message: 'Title, type, mode, and duration are required'
                });
            }

            // Start transaction
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Create test
                const testResult = await client.query(
                    `INSERT INTO tests (
                        title, type, mode, duration_minutes, total_marks,
                        marking_scheme, subjects, syllabus, instructions,
                        scheduled_at, batch_id, created_by, is_published
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false)
                    RETURNING *`,
                    [title, type, mode, duration_minutes, total_marks || 0,
                     marking_scheme || '{"correct": 4, "incorrect": -1, "unattempted": 0}',
                     subjects || [], syllabus, instructions,
                     scheduled_at, batch_id || null, req.userId]
                );

                const test = testResult.rows[0];

                // Add questions to test
                if (question_ids.length > 0) {
                    const questionValues = question_ids.map((qId, index) => {
                        return `($${index * 2 + 1}, $${index * 2 + 2}, ${index})`;
                    }).join(',');

                    const flatParams = [];
                    question_ids.forEach(qId => {
                        flatParams.push(test.id, qId);
                    });

                    await client.query(
                        `INSERT INTO test_questions (test_id, question_id, question_order)
                         VALUES ${questionValues}`,
                        flatParams
                    );
                }

                await client.query('COMMIT');

                res.status(201).json({
                    success: true,
                    message: 'Test created successfully',
                    data: test
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // GET TEST BY ID
    // ============================================
    router.get('/:id', async (req, res, next) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                `SELECT t.*, b.name as batch_name,
                        u.first_name || ' ' || u.last_name as created_by_name,
                        (SELECT COUNT(*) FROM test_questions WHERE test_id = t.id) as question_count
                 FROM tests t
                 LEFT JOIN batches b ON t.batch_id = b.id
                 LEFT JOIN users u ON t.created_by = u.id
                 WHERE t.id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Test not found'
                });
            }

            // Get questions
            const questionsResult = await pool.query(
                `SELECT q.*, tq.question_order, tq.marks as custom_marks
                 FROM test_questions tq
                 JOIN questions q ON tq.question_id = q.id
                 WHERE tq.test_id = $1
                 ORDER BY tq.question_order`,
                [id]
            );

            const test = result.rows[0];
            test.questions = questionsResult.rows;

            res.json({
                success: true,
                data: test
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // UPDATE TEST (Faculty only)
    // ============================================
    router.put('/:id', auth.isFaculty, async (req, res, next) => {
        try {
            const { id } = req.params;
            const {
                title, type, mode, duration_minutes, total_marks,
                marking_scheme, subjects, syllabus, instructions,
                scheduled_at, batch_id, is_published
            } = req.body;

            const result = await pool.query(
                `UPDATE tests SET
                    title = COALESCE($1, title),
                    type = COALESCE($2, type),
                    mode = COALESCE($3, mode),
                    duration_minutes = COALESCE($4, duration_minutes),
                    total_marks = COALESCE($5, total_marks),
                    marking_scheme = COALESCE($6, marking_scheme),
                    subjects = COALESCE($7, subjects),
                    syllabus = COALESCE($8, syllabus),
                    instructions = COALESCE($9, instructions),
                    scheduled_at = COALESCE($10, scheduled_at),
                    batch_id = COALESCE($11, batch_id),
                    is_published = COALESCE($12, is_published),
                    published_at = CASE WHEN $12 = true AND is_published = false 
                                       THEN CURRENT_TIMESTAMP ELSE published_at END,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $13
                 RETURNING *`,
                [title, type, mode, duration_minutes, total_marks,
                 marking_scheme, subjects, syllabus, instructions,
                 scheduled_at, batch_id, is_published, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Test not found'
                });
            }

            res.json({
                success: true,
                message: 'Test updated successfully',
                data: result.rows[0]
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // PUBLISH TEST
    // ============================================
    router.post('/:id/publish', auth.isFaculty, async (req, res, next) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                `UPDATE tests SET
                    is_published = true,
                    published_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1 AND is_published = false
                 RETURNING *`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Test not found or already published'
                });
            }

            // TODO: Send notifications to students in batch

            res.json({
                success: true,
                message: 'Test published successfully',
                data: result.rows[0]
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
};