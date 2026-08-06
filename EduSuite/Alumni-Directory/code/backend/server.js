import dotenv from "dotenv";

dotenv.config();

import app from "./src/app.js";
import {
  testDatabaseConnection
} from "./src/config/database.js";

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    const database =
      await testDatabaseConnection();

    console.log(
      "========================================"
    );
    console.log(
      "EduSuite Alumni Directory Backend"
    );
    console.log(
      "========================================"
    );
    console.log(
      "MariaDB connection: SUCCESS"
    );
    console.log(
      `Database: ${database.databaseName}`
    );
    console.log(
      "========================================"
    );

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
      console.log(
        `Health: http://localhost:${PORT}/health`
      );
      console.log(
        `Alumni: http://localhost:${PORT}/api/v1/alumni`
      );
      console.log(
        "========================================"
      );
    });
  } catch (error) {
    console.error(
      "========================================"
    );
    console.error(
      "Backend startup FAILED"
    );
    console.error(error.message);
    console.error(
      "========================================"
    );

    process.exit(1);
  }
}

startServer();