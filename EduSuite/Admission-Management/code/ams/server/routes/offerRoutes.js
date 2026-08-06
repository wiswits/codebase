const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/offerController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/', ctrl.listOffers);
router.post('/:applicationId/generate', authorize(ROLES.ADMIN, ROLES.ADMISSION_OFFICER), ctrl.generateOffer);
router.get('/application/:applicationId', ctrl.getOfferByApplication);

module.exports = router;
