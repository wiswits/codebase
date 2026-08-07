'use strict';

require('dotenv').config();
const { createApp } = require('./app');

// ⚠️ Root-cause context: Node 20 defaults unhandled promise rejections to
// crashing the process. Express 4 does NOT forward a rejected promise from
// an async route handler to the error middleware — so ANY route (across the
// 16+ route files in this module, several hand-built independently) that
// awaits something without a try/catch can take the ENTIRE server down on a
// single bad request, not just fail that one request. We already fixed one
// concrete instance of this (attempts.js's buildResult on an offline-sourced
// snapshot). Rather than trust every handler in every file to be perfectly
// guarded, log-and-continue here so one more slip degrades to a stuck
// request (caught by app.js's 8s per-request timeout, which returns a 500)
// instead of an outage for every other user.
process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error('[unhandledRejection] a route handler rejected without being caught:', err);
});
process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('[uncaughtException]', err);
});

const PORT = Number(process.env.PORT || 4010);
const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🎯 WISWITS PL (The Loop Engine) listening on :${PORT}  →  /api/pl`);
});
