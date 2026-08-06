// db/seed.js — idempotent global content seed (activities library).
//   node db/seed.js

require('dotenv').config();
const { seedGlobalActivities } = require('../src/modules/wellbeing/wellbeing.activities');
const { closePools } = require('../src/config/db');

(async () => {
  try {
    const r = await seedGlobalActivities();
    console.log(`🌱 Seeded ${r.seeded} global activities.`);
  } catch (e) {
    console.error('Seed failed:', e.message);
    process.exitCode = 1;
  } finally {
    await closePools();
  }
})();
