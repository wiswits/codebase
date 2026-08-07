const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./src/config/database');
const { errorHandler } = require('./src/middleware/errorHandler');
const { logger } = require('./src/utils/logger');

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://wiswits.com'] 
    : ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX),
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

connectDB();

app.use('/api/v1/auth', require('./src/routes/auth.routes'));
app.use('/api/v1/documents', require('./src/routes/document.routes'));
app.use('/api/v1/templates', require('./src/routes/template.routes'));
app.use('/api/v1/verification', require('./src/routes/verification.routes'));
app.use('/api/v1/approvals', require('./src/routes/approval.routes'));
app.use('/api/v1/print-jobs', require('./src/routes/printJob.routes'));
app.use('/api/v1/audit', require('./src/routes/audit.routes'));
app.use('/api/v1/dashboard', require('./src/routes/dashboard.routes'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 WisWits Document Engine running on port ${PORT}`);
  logger.info(`📚 Environment: ${process.env.NODE_ENV}`);
});