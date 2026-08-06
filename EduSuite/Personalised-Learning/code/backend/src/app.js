'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { context } = require('./middleware/context');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.use(context);

  // ⚠️ Safety net: Express 4 does NOT forward a rejected promise from an
  // async route handler to the error middleware — an uncaught rejection
  // (e.g. a malformed query) just hangs the request forever with no
  // response. This doesn't fix the bug, but it stops a single bad handler
  // from silently wedging a client/test suite; the 500 + log makes it loud.
  if (process.env.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
      const timer = setTimeout(() => {
        if (!res.headersSent) {
          console.error(`[timeout] ${req.method} ${req.path} exceeded 8s — likely an unhandled async rejection in the handler`);
          res.status(500).json({ error: 'internal_timeout', path: req.path });
        }
      }, 8000);
      res.on('finish', () => clearTimeout(timer));
      next();
    });
  }

  // health at root
  app.use('/', require('./routes/health'));

  // module API surface — mounted under /api/pl (spec API prefix)
  const api = express.Router();
  api.use(require('./routes/analyze'));
  api.use(require('./routes/cycles'));
  api.use(require('./routes/widgets'));
  api.use(require('./routes/offlineTests'));
  api.use(require('./routes/attempts'));
  api.use(require('./routes/studentReport'));
  api.use(require('./routes/weakAreas'));
  api.use(require('./routes/testAnalytics'));
  // ─── Phase A additions ──────────────────────────────────────
  api.use(require('./routes/testBuilder'));
  api.use(require('./routes/blueprints'));
  api.use(require('./routes/assignments'));
  api.use(require('./routes/myTests'));
  api.use(require('./routes/omr'));
  api.use(require('./routes/worksheets'));
  api.use(require('./routes/recoveryCyclesFull'));
  api.use(require('./routes/profile'));
  api.use(require('./routes/attemptAnalytics'));
  api.use(require('./routes/testQuality'));
  api.use(require('./routes/studentAnalyticsExtra'));
  api.use(require('./routes/classSchoolAnalytics'));
  api.use(require('./routes/alerts'));
  api.use(require('./routes/insights'));
  api.use(require('./routes/digest'));
  api.use(require('./routes/practice'));
  api.use(require('./routes/widgetsExtra'));
  app.use('/api/pl', api);

  // 404
  app.use((req, res) => res.status(404).json({ error: 'not_found', path: req.path }));

  // error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: 'internal', detail: err.message });
  });

  return app;
}

module.exports = { createApp };
