// ============================================
// OMR ROUTES
// ============================================

const authMiddleware = require('../middleware/auth');
const { upload } = require('../middleware/fileUpload');
const {
    uploadOMR,
    getOMRData,
    manualOverride,
    reprocessOMR
} = require('../controllers/omrController');

module.exports = function(pool) {
    const router = require('express').Router();
    const auth = authMiddleware(pool);

    // All routes require authentication
    router.use(auth.verifyToken);

    // Upload OMR sheet (Faculty/Admin only)
    router.post('/upload', auth.isFaculty, upload.single('omr_file'), uploadOMR);

    // Get OMR data
    router.get('/:attemptId', getOMRData);

    // Manual override (Faculty/Admin only)
    router.put('/:attemptId/override', auth.isFaculty, manualOverride);

    // Reprocess OMR (Faculty/Admin only)
    router.post('/:attemptId/reprocess', auth.isFaculty, reprocessOMR);

    return router;
};