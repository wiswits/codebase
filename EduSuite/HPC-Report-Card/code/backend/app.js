import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger.js";

import hpcRoutes from "./routes/hpc.routes.js";

const app = express();

/* ============================================================
   CORS
============================================================ */

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

/* ============================================================
   MIDDLEWARE
============================================================ */

app.use(helmet());

app.use(morgan("dev"));

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* ============================================================
   HOME
============================================================ */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    application: "EduSuite HPC Report Card API",
    version: "1.0.0",
    status: "Running",
    documentation: "http://localhost:5000/api/docs",
  });
});

/* ============================================================
   HEALTH CHECK
============================================================ */

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "UP",
    service: "EduSuite HPC Report Card API",
    timestamp: new Date().toISOString(),
  });
});

/* ============================================================
   SWAGGER
============================================================ */

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

/* ============================================================
   API ROUTES
============================================================ */

app.use("/api", hpcRoutes);

/* ============================================================
   404 HANDLER
============================================================ */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route '${req.originalUrl}' not found`,
  });
});

/* ============================================================
   GLOBAL ERROR HANDLER
============================================================ */

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;