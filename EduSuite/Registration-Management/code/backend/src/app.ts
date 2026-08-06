import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middleware/error.middleware.js";
import { tenantMiddleware } from "./middleware/tenant.middleware.js";
import { registrationRouter } from "./modules/registration/routes/registration.routes.js";

export const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Registration Management API is healthy.",
    data: {
      service: "registration-management",
      environment: env.nodeEnv,
    },
  });
});

/*
 * Temporary standalone integration tenant context.
 *
 * In the host SaaS this middleware must be replaced/aligned with
 * authenticated organization context.
 */
app.use(tenantMiddleware);

app.use(
  "/api/v1/registrations",
  registrationRouter,
);

app.use(notFoundMiddleware);
app.use(errorMiddleware);