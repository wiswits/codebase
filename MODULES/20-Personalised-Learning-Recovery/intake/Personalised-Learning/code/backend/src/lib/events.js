'use strict';

/**
 * PL event bus. In production this publishes to the platform message bus;
 * here it is an EventEmitter with structured logging so the 12 contract
 * events are observable in dev + tests.
 *
 * ⭐⭐⭐ pl.gap_closed is the most important — it is the proof of the Loop.
 */

const { EventEmitter } = require('events');

const bus = new EventEmitter();
bus.setMaxListeners(100);

const KNOWN = Object.freeze([
  'pl.test_created',
  'pl.test_published',
  'pl.assigned',
  'pl.attempted',
  'pl.weak_detected',
  'pl.worksheet_generated',
  'pl.gap_closed',
  'pl.needs_teacher',
  'pl.reteach_alert',
  'pl.question_flagged',
  'pl.question_stats',
  'pl.qbank_shortage',
  'pl.profile_updated',
]);

function emit(type, payload) {
  if (!KNOWN.includes(type)) {
    // eslint-disable-next-line no-console
    console.warn(`[events] unknown event type: ${type}`);
  }
  const event = { type, at: new Date().toISOString(), ...payload };
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.log(`[event] ${type}`, JSON.stringify(payload));
  }
  bus.emit(type, event);
  bus.emit('*', event);
  return event;
}

module.exports = { bus, emit, KNOWN };
