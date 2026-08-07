// ============================================
// OMR CONTROLLER
// ============================================

const OMRService = require('../services/omr.service');
const { query } = require('../config/database');
const logger = require('../utils/logger');

// ============================================
// UPLOAD OMR SHEET
// ============================================
const uploadOMR = async (req, res, next) => {
    try {
        const { attempt_id } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        if (!attempt_id) {
            return res.status(400).json({
                success: false,
                message: 'Attempt ID is required'
            });
        }

        // Process OMR
        const result = await OMRService.processOMR(attempt_id, file.path);

        res.json({
            success: true,
            message: 'OMR processed successfully',
            data: result.data
        });

    } catch (error) {
        logger.error('OMR upload error:', error);
        next(error);
    }
};

// ============================================
// GET OMR DATA
// ============================================
const getOMRData = async (req, res, next) => {
    try {
        const { attemptId } = req.params;

        const result = await query(
            `SELECT 
                id, student_id, test_id, status,
                omr_file_path, omr_processed, omr_confidence,
                evaluated_answers, score_obtained,
                total_correct, total_incorrect, total_unattempted
             FROM attempts 
             WHERE id = $1`,
            [attemptId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Attempt not found'
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
// MANUAL OVERRIDE
// ============================================
const manualOverride = async (req, res, next) => {
    try {
        const { attemptId } = req.params;
        const { question_id, correct_answer } = req.body;

        if (!question_id || correct_answer === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Question ID and correct answer are required'
            });
        }

        const result = await OMRService.manualOverride(attemptId, question_id, correct_answer);

        res.json({
            success: true,
            message: 'Manual override successful',
            data: result.data
        });

    } catch (error) {
        logger.error('Manual override error:', error);
        next(error);
    }
};

// ============================================
// RE-PROCESS OMR
// ============================================
const reprocessOMR = async (req, res, next) => {
    try {
        const { attemptId } = req.params;

        // Get attempt
        const attemptResult = await query(
            'SELECT * FROM attempts WHERE id = $1',
            [attemptId]
        );

        if (attemptResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Attempt not found'
            });
        }

        const attempt = attemptResult.rows[0];

        if (!attempt.omr_file_path) {
            return res.status(400).json({
                success: false,
                message: 'No OMR file found for this attempt'
            });
        }

        // Re-process
        const result = await OMRService.processOMR(attemptId, attempt.omr_file_path);

        res.json({
            success: true,
            message: 'OMR reprocessed successfully',
            data: result.data
        });

    } catch (error) {
        logger.error('OMR reprocess error:', error);
        next(error);
    }
};

// ============================================
// EXPORTS - SINGLE EXPORT
// ============================================
module.exports = {
    uploadOMR,
    getOMRData,
    manualOverride,
    reprocessOMR
};