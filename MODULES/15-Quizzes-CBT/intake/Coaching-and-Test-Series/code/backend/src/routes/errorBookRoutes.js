// ============================================
// ERROR BOOK ROUTES
// ============================================

const authMiddleware = require('../middleware/auth');

module.exports = function(pool) {
    const router = require('express').Router();
    const auth = authMiddleware(pool);

    // All routes require authentication
    router.use(auth.verifyToken);

    // ============================================
    // GET ERROR BOOK FOR STUDENT
    // ============================================
    router.get('/student/:studentId', async (req, res, next) => {
        try {
            const { studentId } = req.params;
            const { in_active_deck, subject, limit = 50, offset = 0 } = req.query;

            let query = `
                SELECT eb.*, q.question_text, q.subject, q.chapter, q.difficulty,
                       q.options, q.correct_answers, q.explanation
                FROM error_book eb
                JOIN questions q ON eb.question_id = q.id
                WHERE eb.student_id = $1
            `;
            const params = [studentId];
            let paramIndex = 2;

            if (in_active_deck !== undefined) {
                query += ` AND eb.in_active_deck = $${paramIndex}`;
                params.push(in_active_deck === 'true');
                paramIndex++;
            }

            if (subject) {
                query += ` AND q.subject = $${paramIndex}`;
                params.push(subject);
                paramIndex++;
            }

            query += ` ORDER BY eb.added_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await pool.query(query, params);

            // Get stats
            const statsResult = await pool.query(
                `SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN is_mastered = true THEN 1 END) as mastered,
                    COUNT(CASE WHEN is_mastered = false AND in_active_deck = true THEN 1 END) as in_progress
                 FROM error_book
                 WHERE student_id = $1`,
                [studentId]
            );

            res.json({
                success: true,
                data: {
                    errors: result.rows,
                    stats: statsResult.rows[0] || { total: 0, mastered: 0, in_progress: 0 },
                    pagination: {
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        total: result.rows.length
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // REMOVE QUESTION FROM ERROR BOOK
    // ============================================
    router.delete('/:id', async (req, res, next) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                `UPDATE error_book SET
                    in_active_deck = false,
                    removed_from_deck_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1
                 RETURNING *`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Error book entry not found'
                });
            }

            res.json({
                success: true,
                message: 'Question removed from error book',
                data: result.rows[0]
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // MARK QUESTION AS MASTERED
    // ============================================
    router.put('/:id/master', async (req, res, next) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                `UPDATE error_book SET
                    is_mastered = true,
                    in_active_deck = false,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1
                 RETURNING *`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Error book entry not found'
                });
            }

            res.json({
                success: true,
                message: 'Question marked as mastered',
                data: result.rows[0]
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // GET ERROR BOOK STATS
    // ============================================
    router.get('/stats/:studentId', async (req, res, next) => {
        try {
            const { studentId } = req.params;

            // By subject
            const subjectResult = await pool.query(
                `SELECT 
                    q.subject,
                    COUNT(*) as total,
                    COUNT(CASE WHEN eb.is_mastered = true THEN 1 END) as mastered,
                    COUNT(CASE WHEN eb.is_mastered = false AND eb.in_active_deck = true THEN 1 END) as in_progress
                 FROM error_book eb
                 JOIN questions q ON eb.question_id = q.id
                 WHERE eb.student_id = $1
                 GROUP BY q.subject`,
                [studentId]
            );

            // By difficulty
            const difficultyResult = await pool.query(
                `SELECT 
                    q.difficulty,
                    COUNT(*) as total
                 FROM error_book eb
                 JOIN questions q ON eb.question_id = q.id
                 WHERE eb.student_id = $1
                 GROUP BY q.difficulty`,
                [studentId]
            );

            res.json({
                success: true,
                data: {
                    bySubject: subjectResult.rows || [],
                    byDifficulty: difficultyResult.rows || []
                }
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
};