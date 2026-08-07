// server.js — entry point.
//
// ⚠️ The server REFUSES to boot if a guardrail is broken. A running server
//    with a broken promise is worse than a server that won't run.

require('dotenv').config();

const { buildApp } = require('./app');
const { ROUTE_PATHS } = require('./modules/wellbeing/wellbeing.routes');
const { verifyGuardrailsAtBoot } = require('./modules/wellbeing/wellbeing.boot');

async function main() {
  // DB checks require MySQL + migrations. Skip them only when explicitly asked
  // (e.g. a local run without a DB); default is full verification.
  const skipDb = process.env.WB_SKIP_DB_BOOT_CHECK === '1';

  const result = await verifyGuardrailsAtBoot({ routePaths: ROUTE_PATHS, skipDb });
  if (!result.ok) {
    process.exit(1);
  }
  console.log('✅ Well-being guardrails verified at boot.');

  const app = buildApp();
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`🌱 Well-being API listening on :${port}  (prefix /api/wb)`);
  });
}

main().catch(e => { console.error(e); process.exit(1); });
