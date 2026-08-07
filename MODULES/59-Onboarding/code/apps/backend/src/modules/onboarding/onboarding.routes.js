const express = require('express');
const router = express.Router();
const ctrl = require('./onboarding.controller');
const { authenticate } = require('../../middleware/auth');
const { onboardingLimiter, onboardingLookupLimiter } = require('../../middleware/rateLimits');

// The one endpoint that creates something, and the only one that needs the
// strict unauthenticated-writer budget.
router.post('/register-org', onboardingLimiter, ctrl.registerOrg);

// Read-only wizard lookups: generous limit, because a customer filling one form
// legitimately hits several of these and must never be locked out of signing up.
router.get('/check-email', onboardingLookupLimiter, ctrl.checkEmail);
router.get('/blueprint-preview', onboardingLookupLimiter, ctrl.blueprintPreview);
router.get('/pincode', onboardingLookupLimiter, ctrl.lookupPincode);

router.get('/trial-status', authenticate, ctrl.trialStatus);
router.get('/progress', authenticate, ctrl.onboardingProgress);

module.exports = router;
