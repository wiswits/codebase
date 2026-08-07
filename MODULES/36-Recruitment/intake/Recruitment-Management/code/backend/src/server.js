import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createPool } from './config/database.js';
import recruitmentRoutes from './modules/recruitment/routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5008;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'recruitment-module',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/recruitment', recruitmentRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    statusCode: 500,
    message: 'Internal server error',
    errors: [err.message],
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'API endpoint not found',
  });
});

const startServer = async () => {
  try {
    const pool = createPool();
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 Recruitment Module Backend running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;