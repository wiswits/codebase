require("dotenv").config();

const app = require("./src/app");
const { testConnection } = require("./src/config/database");

const PORT = process.env.PORT || 5000;
testConnection();

const server = app.listen(PORT, () => {
    console.log("==========================================");
    console.log("🚀 EduSuite HR-PMS Backend Started");
    console.log(`🌐 Server : http://localhost:${PORT}`);
    console.log(`📦 Environment : ${process.env.NODE_ENV || "development"}`);
    console.log("==========================================");
});

/**
 * Graceful Shutdown
 */

process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down server...");
    server.close(() => {
        console.log("✅ Server stopped.");
        process.exit(0);
    });
});

process.on("SIGTERM", () => {
    console.log("\n🛑 Server terminated.");
    server.close(() => {
        process.exit(0);
    });
});