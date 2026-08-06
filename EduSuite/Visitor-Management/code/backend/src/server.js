import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";

import {
  checkDatabaseConnection,
  closeDatabase,
} from "./platform-adapters/database.js";

const PORT = Number(
  process.env.PORT || 5000
);

async function startServer() {
  try {
    const connected =
      await checkDatabaseConnection();

    if (!connected) {
      throw new Error(
        "Database connection check failed."
      );
    }

    const server = app.listen(
      PORT,
      () => {
        console.log(
          `Visitor Management API running on http://localhost:${PORT}`
        );

        console.log(
          `MariaDB connected: ${process.env.DB_NAME}`
        );
      }
    );

    async function shutdown(signal) {
      console.log(
        `\n${signal} received. Shutting down...`
      );

      server.close(async () => {
        try {
          await closeDatabase();
        } finally {
          process.exit(0);
        }
      });
    }

    process.on(
      "SIGINT",
      () => shutdown("SIGINT")
    );

    process.on(
      "SIGTERM",
      () => shutdown("SIGTERM")
    );
  } catch (error) {
    console.error(
      "Backend startup failed:",
      error.message
    );

    await closeDatabase().catch(() => {});

    process.exit(1);
  }
}

startServer();