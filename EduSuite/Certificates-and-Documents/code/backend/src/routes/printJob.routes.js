const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const PrintJobController = require('../controllers/printJob.controller');

router.use(authenticate);

router.get('/', PrintJobController.getPrintJobs.bind(PrintJobController));
router.get('/queue', PrintJobController.getPrintQueue.bind(PrintJobController));
router.get('/stats', PrintJobController.getPrintStats.bind(PrintJobController));
router.post('/:jobId/start', PrintJobController.startPrintJob.bind(PrintJobController));
router.post('/:jobId/complete', PrintJobController.completePrintJob.bind(PrintJobController));
router.post('/:jobId/cancel', PrintJobController.cancelPrintJob.bind(PrintJobController));

module.exports = router;