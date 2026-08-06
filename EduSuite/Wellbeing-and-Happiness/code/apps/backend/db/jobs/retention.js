// db/jobs/retention.js
// Daily retention sweep. Wire this to cron / the platform scheduler:
//   0 3 * * *  node db/jobs/retention.js
//
// Anonymizes old pulses, purges old journal entries, expires stale flags.

require('dotenv').config();
const { runDailyRetention } = require('../../src/modules/wellbeing/wellbeing.retention');
const { closePools } = require('../../src/config/db');

(async () => {
  try {
    const result = await runDailyRetention();
    console.log('🧹 Retention sweep complete:', JSON.stringify(result));
  } catch (e) {
    console.error('Retention sweep failed:', e.message);
    process.exitCode = 1;
  } finally {
    await closePools();
  }
})();
