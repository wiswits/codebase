'use strict';
const Joi = require('joi');

const STATUSES = ['draft', 'scheduled', 'published', 'completed', 'cancelled'];

/*
 * What KIND of day this is (migration 047). A school year is one timeline, and
 * these are its five kinds — not five modules. Keeping them as VALUES is what
 * lets Events, Activities, Festivals, Holidays and Academic dates share one
 * screen, one Calendar source and one audience, and it adds zero sidebar
 * entries (§9, §21).
 *
 * The column is VARCHAR, not ENUM, because a code↔DB ENUM mismatch produces a
 * masked 500 with no log line. This list is the enforcement: a bad value is
 * rejected HERE, at the edge, with a 400 that names the field.
 */
const CATEGORIES = ['event', 'activity', 'festival', 'holiday', 'academic'];

// '#RGB' or '#RRGGBB'. The school's own override for how a day is drawn; NULL
// means "use the colour for this category", decided in calendar.routes.js.
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/*
 * The shape of every field, defined ONCE — and with NO defaults.
 *
 * THE BUG THIS SHAPE FIXES. `updateEventSchema` used to be `eventSchema.fork(…)`,
 * which inherits every `.default()`. `validate()` in _kit.js then REPLACES
 * req.body with the validated value, and `updateEvent` writes every key that is
 * not `undefined`. So a PATCH carrying nothing but a new location arrived at the
 * database as `status='draft', rsvp_enabled=1` — correcting the venue of a
 * PUBLISHED event silently un-published it, and it vanished from every teacher,
 * student and parent screen in the school. Nothing in the UI sends `status` on
 * an edit, so this fired on EVERY edit.
 *
 * A create-time default is an answer for a field the caller did not mention. On
 * a PATCH the caller not mentioning a field means "leave it alone" — the exact
 * opposite. So defaults are applied below, in the create schema only, and the
 * update schema is built from these bare shapes rather than forked from it.
 */
const fields = {
  title: Joi.string().min(3).max(255),
  description: Joi.string().allow('', null),
  eventType: Joi.string().max(100).allow('', null),
  category: Joi.string().valid(...CATEGORIES),
  startDatetime: Joi.date().iso(),
  // An all-day event covers whole days, so its end may EQUAL its start — a
  // one-day holiday is 15 Aug to 15 Aug. Requiring `greater` there would make
  // the commonest holiday in the country unsaveable, so the rule is relaxed
  // for all-day only and stays strict for anything with a clock.
  endDatetime: Joi.date().iso().when('allDay', {
    is: true,
    then: Joi.date().min(Joi.ref('startDatetime')),
    otherwise: Joi.date().greater(Joi.ref('startDatetime')),
  }),
  allDay: Joi.boolean(),
  color: Joi.string().pattern(HEX_COLOR).allow('', null),
  location: Joi.string().max(255).allow('', null),
  capacity: Joi.number().integer().min(1).allow(null),
  rsvpEnabled: Joi.boolean(),
  // The school EXPECTS an answer, as opposed to `rsvpEnabled` which only says
  // an answer is possible. Nothing chases on it yet — that is Phase 5.
  rsvpRequired: Joi.boolean(),
  rsvpDeadline: Joi.date().iso().allow(null),
  status: Joi.string().valid(...STATUSES),
};

// CREATE — the only place a default belongs.
const eventSchema = Joi.object({
  ...fields,
  title: fields.title.required(),
  category: fields.category.default('event'),
  startDatetime: fields.startDatetime.required(),
  endDatetime: fields.endDatetime.required(),
  allDay: fields.allDay.default(false),
  rsvpEnabled: fields.rsvpEnabled.default(true),
  rsvpRequired: fields.rsvpRequired.default(false),
  status: fields.status.default('draft'),
});

// UPDATE — every field optional, and every one of them absent means "unchanged".
const updateEventSchema = Joi.object(fields);

const statusSchema = Joi.object({
  status: Joi.string().valid(...STATUSES).required(),
});

// Which shelf an event sits on. Deliberately NOT a `status` value: status is the
// publication lifecycle the school reads on the card ("Cancelled", "Completed"),
// and archiving an event says nothing about whether it happened.
const LIFECYCLE_STATES = ['active', 'archived', 'deleted'];

const lifecycleSchema = Joi.object({
  state: Joi.string().valid(...LIFECYCLE_STATES).required(),
});

const eventIdParams = Joi.object({
  eventId: Joi.number().integer().positive().required(),
});

const listQuery = Joi.object({
  search: Joi.string().max(255).allow('', null),
  status: Joi.string().valid(...STATUSES).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  view: Joi.string().valid(...LIFECYCLE_STATES).default('active'),
});

module.exports = {
  STATUSES, LIFECYCLE_STATES, CATEGORIES,
  eventSchema, updateEventSchema, statusSchema, lifecycleSchema, eventIdParams, listQuery,
};
