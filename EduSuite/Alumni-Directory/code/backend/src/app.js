import express from "express";
import cors from "cors";

import alumniRoutes from "./modules/alumni/alumni.routes.js";

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

/*
 * ============================================================
 * TEMPORARY STANDALONE INTEGRATION CONTEXT
 * ============================================================
 *
 * This is NOT the production authentication implementation.
 *
 * WisWits will provide shared authentication and tenant context
 * during final platform alignment.
 *
 * For standalone Alumni integration/testing we use organization 1.
 */
app.use((req, res, next) => {
  req.orgId = 1;
  next();
});

/*
 * Health Check
 */
app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "EduSuite Alumni Directory Backend",
    module: "alumni",
    status: "healthy"
  });
});

/*
 * Alumni Module
 */
app.use("/api/v1/alumni", alumniRoutes);

/*
 * 404
 */
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found."
    }
  });
});

/*
 * Final controlled error boundary
 */
app.use((error, req, res, next) => {
  console.error("Unhandled application error:", error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred."
    }
  });
});

export default app;