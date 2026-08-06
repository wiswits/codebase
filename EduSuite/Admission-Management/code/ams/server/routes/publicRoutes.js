const express = require('express');
const router = express.Router();
const appCtrl = require('../controllers/applicationController');
const offerCtrl = require('../controllers/offerController');
const docCtrl = require('../controllers/documentController');
const { upload } = require('../middleware/upload');

// Public application form (FR1-FR3)
router.post('/applications/start', appCtrl.startApplication);
router.get('/applications/:draftToken', appCtrl.getDraft);
router.patch('/applications/:draftToken', appCtrl.saveDraftStep);
router.post('/applications/:draftToken/submit', appCtrl.submitApplication);

// Public document upload against a draft/submitted application (FR11)
router.post('/documents/:docId/upload', upload.single('file'), docCtrl.uploadDocument);
router.get('/documents/checklist/:classApplied', docCtrl.getChecklist);

// Public offer accept/reject via token (FR23/FR24)
router.get('/offers/:token', offerCtrl.getOfferByToken);
router.post('/offers/:token/decision', offerCtrl.decideOffer);

module.exports = router;
