const { Router } = require('express');
const eventsRoutes = require('./events.routes');

const router = Router();

// Engineering Standards §26: /api/v1/<module>/<resource>
router.use('/api/v1/events', eventsRoutes);

module.exports = router;
