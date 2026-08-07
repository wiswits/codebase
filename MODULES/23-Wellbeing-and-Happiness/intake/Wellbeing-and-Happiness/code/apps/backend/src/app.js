// app.js — builds the Express app (without listening, so tests can import it).

const express = require('express');
const { router: wbRouter } = require('./modules/wellbeing/wellbeing.routes');
const { HttpError } = require('./modules/wellbeing/wellbeing.errors');

function buildApp() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.use('/api/wb', wbRouter);

  // Central error translator. Typed errors carry their own status; anything
  // else is a 500 with no internals leaked.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.name, message: err.message });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({ error: 'InternalError', message: 'Something went wrong.' });
  });

  return app;
}

module.exports = { buildApp };
