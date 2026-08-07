import express from "express";

import visitorRoutes from "./modules/visitor/visitor.routes.js";

const app = express();

app.disable("x-powered-by");

app.use(express.json({
  limit: "1mb",
}));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "visitor-management",
    status: "healthy",
  });
});

app.use(
  "/api/visitors",
  visitorRoutes
);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  const statusCode =
    Number(error.statusCode) || 500;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error."
        : error.message,
  });
});

export default app;