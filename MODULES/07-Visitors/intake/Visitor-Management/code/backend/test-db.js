import {
  checkDatabaseConnection,
  query,
  closeDatabase,
} from "./src/platform-adapters/database.js";

try {
  const connected = await checkDatabaseConnection();

  console.log("Database connected:", connected);

  const rows = await query(`
    SELECT
      id,
      org_id,
      visitor_name,
      status
    FROM client_visitor_logs
    ORDER BY id ASC
  `);

  console.log("Visitor records:", rows);
} catch (error) {
  console.error("Database test failed:");
  console.error(error.message);
} finally {
  await closeDatabase();
}