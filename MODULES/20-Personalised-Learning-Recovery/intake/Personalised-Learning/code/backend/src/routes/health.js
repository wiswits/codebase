'use strict';

const express = require('express');
const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, module: 'pl', codename: 'The Loop Engine', ts: new Date().toISOString() });
});

module.exports = router;
