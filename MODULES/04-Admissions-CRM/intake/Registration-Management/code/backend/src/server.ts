import { app } from "./app.js";
import { pool, testDatabaseConnection } from "./config/database.js";
import { env } from "./config/env.js";

async function start(): Promise<void> {
  try {
    await testDatabaseConnection();

    const server = app.listen(env.port, () => {
      console.log(
        `✓ Registration Management API running on port ${env.port}`,
      );
      console.log(
        `✓ Environment: ${env.nodeEnv}`,
      );
    });

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n${signal} received. Shutting down...`);

      server.close(async () => {
        try {
          await pool.end();
          console.log("✓ MariaDB pool closed");
          process.exit(0);
        } catch (error) {
          console.error(
            "Error while closing MariaDB pool:",
            error,
          );
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
  } catch (error) {
    console.error(
      "Failed to start Registration Management API:",
      error,
    );

    try {
      await pool.end();
    } catch {
      // Nothing else to do.
    }

    process.exit(1);
  }
}

void start();