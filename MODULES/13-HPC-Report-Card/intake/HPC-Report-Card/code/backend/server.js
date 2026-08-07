import app from "./app.js";
import pool from "./config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Test MariaDB Connection
        const connection = await pool.getConnection();

        console.log("✅ MariaDB Connected Successfully");

        connection.release();

        app.listen(PORT, () => {
            console.log("==========================================");
            console.log(`🚀 Server Running on Port ${PORT}`);
            console.log(`🌐 API Base URL : http://localhost:${PORT}/api`);
            console.log(`📘 Swagger Docs : http://localhost:${PORT}/api/docs`);
            console.log(`❤️ Health Check : http://localhost:${PORT}/health`);
            console.log("==========================================");
        });

    } catch (error) {
        console.error("❌ Failed to connect to MariaDB");
        console.error(error.message);
        process.exit(1);
    }
};

startServer();