const router = require('express').Router();
const ctrl = require('./parent-link.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.post('/students/:id/invite-code/regenerate', ctrl.regenerateInviteCode);
router.get('/students/:id/parents', ctrl.getStudentParents);

router.post('/parent-link/by-code', ctrl.linkByInviteCode);
router.post('/parent-link/request', ctrl.requestLink);
router.get('/parent-link/me/children', ctrl.getMyChildren);

router.get('/parent-link/requests', ctrl.listLinkRequests);
router.post('/parent-link/requests/:id/approve', ctrl.approveLinkRequest);
router.post('/parent-link/requests/:id/reject', ctrl.rejectLinkRequest);
router.delete('/parent-link/links/:id', ctrl.unlinkParent);

module.exports = router;
