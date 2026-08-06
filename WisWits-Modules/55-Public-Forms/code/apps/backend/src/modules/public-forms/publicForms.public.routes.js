'use strict';
/*
 * PUBLIC intake router — the ONLY unauthenticated surface for custom forms.
 * Mounted separately from the authenticated admin router (the auth boundary is a
 * FILE boundary, not a movable line). Its own generous per-IP limiter: a school
 * sharing its admissions link far and wide stays comfortable; a bot spamming
 * submissions does not, and cannot consume the app's shared budget.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const ctrl = require('./publicForms.controller');

const readLimiter = rateLimit({
  windowMs: 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests. Please wait a moment.' },
});
// Submissions are writes — tighter ceiling, still fine for a busy admissions day.
const submitLimiter = rateLimit({
  windowMs: 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false,
  message: { status: 'error', message: 'Too many submissions. Please wait a moment and try again.' },
});

router.get('/:token', readLimiter, ctrl.publicGet);
router.post('/:token', submitLimiter, ctrl.publicSubmit);

module.exports = router;
