const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

/**
 * ============================================================
 * Middlewares
 * ============================================================
 */


app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(helmet());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

/**
 * ============================================================
 * Health Check
 * ============================================================
 */

app.get("/health", (req, res) => {

    res.status(200).json({

        success: true,

        message: "HR-PMS Backend Running Successfully",

        timestamp: new Date().toISOString()

    });

});

/**
 * ============================================================
 * Root Route
 * ============================================================
 */

app.get("/", (req, res) => {

    res.json({

        success: true,

        application: "the HR-PMS intern build Backend",

        version: "1.0.0"

    });

});

/**
 * ============================================================
 * PMS Routes
 * ============================================================
 */
const routes = require("./routes");

app.use("/api/pms", routes);

/**
 * ============================================================
 * Error Middleware
 * ============================================================
 */

const notFound = require("./middleware/notFound");

const errorHandler = require("./middleware/errorHandler");

app.use(notFound);

app.use(errorHandler);

module.exports = app;