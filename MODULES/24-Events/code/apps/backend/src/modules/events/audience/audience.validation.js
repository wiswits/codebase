'use strict';
const Joi = require('joi');
const { SELECTORS, APPLIES_TO, MODES } = require('../../../services/audience');

/*
 * The rule vocabulary, enforced at the edge.
 *
 * The columns are VARCHAR rather than ENUM (migration 048) precisely so that a
 * bad value is caught HERE, as a 400 that names the field, instead of becoming
 * a masked 500 with no log line — which is what a code↔DB ENUM mismatch does,
 * and has done four times in this codebase.
 *
 * `selector_id` and `selector_value` are conditionally required, because a rule
 * that names nothing resolves to nobody and would silently shrink an audience.
 * Saying so at the edge is the difference between "you must choose a class" and
 * an event that quietly reaches five fewer families than the school intended.
 */
const audienceRule = Joi.object({
  mode: Joi.string().valid(...MODES).default('include'),
  selector: Joi.string().valid(...SELECTORS).required(),

  // class / section / group / individual all point at a row by id.
  selectorId: Joi.number().integer().positive().allow(null)
    .when('selector', {
      is: Joi.valid('class', 'section', 'group', 'individual'),
      then: Joi.number().integer().positive().required(),
      otherwise: Joi.optional(),
    }),

  // staff_kind carries 'teaching' | 'support'; role carries a role slug.
  selectorValue: Joi.string().max(60).allow(null, '')
    .when('selector', {
      is: 'staff_kind',
      then: Joi.string().valid('teaching', 'support').required(),
    })
    .when('selector', {
      is: 'role',
      then: Joi.string().max(60).required(),
    }),

  appliesTo: Joi.string().valid(...APPLIES_TO).default('both'),
});

/*
 * The whole rule set is replaced in one call, never patched rule by rule.
 *
 * An audience is read as a sentence and edited as a sentence: a school that
 * removes "Class 9" and adds "Class 10" has made ONE change to who is invited,
 * and two separate requests could leave the event addressed to both classes or
 * to neither if the second failed. Replacing the set makes the saved state
 * always equal to what the picker was showing.
 *
 * An EMPTY array is legal and meaningful: it restores "the whole
 * organisation", which is the default and how every event behaves today.
 *
 * The cap is a guard, not a product limit — 200 hand-picked rules is not a
 * school expressing an audience, it is a runaway client.
 */
const setAudienceBody = Joi.object({
  rules: Joi.array().items(audienceRule).max(200).required(),
});

// Previewing takes the same rules WITHOUT saving them, so the picker can show
// "reaches 214 people" before anything is committed.
const previewBody = Joi.object({
  rules: Joi.array().items(audienceRule).max(200).required(),
  schoolId: Joi.number().integer().positive().allow(null),
});

const eventIdParams = Joi.object({
  eventId: Joi.number().integer().positive().required(),
});

module.exports = { audienceRule, setAudienceBody, previewBody, eventIdParams };
