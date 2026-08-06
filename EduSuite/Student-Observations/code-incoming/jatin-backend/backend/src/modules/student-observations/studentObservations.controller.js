/**
 * studentObservations.controller.js  (Jatin's portion)
 *
 * Owner: Jatin
 * Scope: HTTP handlers for List and Update only.
 *
 * TODO: Integrate with Neha's existing controller foundation — she owns the
 * controller file itself plus createObservationHandler / getObservationHandler.
 * These two handlers are written to be merged in, not to start a second
 * controller/router architecture (Section 26).
 *
 * These handlers assume authenticate + requirePermission have already run
 * as route middleware (Section 27/28) — no auth/permission logic lives here.
 */

'use strict';

const service = require('./studentObservations.service');

/**
 * GET /api/v1/student-observations
 */
async function listObservationsHandler(req, res, next) {
  try {
    const data = await service.listObservations(req, req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err); // TODO: confirm this reaches the platform's standard error-response middleware
  }
}

/**
 * PATCH /api/v1/student-observations/:id
 */
async function updateObservationHandler(req, res, next) {
  try {
    const data = await service.updateObservation(req, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err); // TODO: confirm this reaches the platform's standard error-response middleware
  }
}

module.exports = {
  listObservationsHandler,
  updateObservationHandler,
};
