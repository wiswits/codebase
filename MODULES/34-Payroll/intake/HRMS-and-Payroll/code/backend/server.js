// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// IMPORT ROUTES
// ============================================================

const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const leaveRoutes = require('./routes/leave.routes');
const documentRoutes = require('./routes/document.routes');
const payrollRoutes = require('./routes/payroll.routes');
const reportRoutes = require('./routes/report.routes');
const cpdRoutes = require('./routes/cpd.routes');
const appraisalRoutes = require('./routes/appraisal.routes');
const exitRoutes = require('./routes/exit.routes');
const expenseRoutes = require('./routes/expense.routes');
const emailRoutes = require('./routes/email.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const notificationRoutes = require('./routes/notification.routes');
const onboardingRoutes = require('./routes/onboarding.routes');
const recruitmentRoutes = require('./routes/recruitment.routes');
const lmsRoutes = require('./routes/lms.routes');
const supportRoutes = require('./routes/support.routes');
const rewardsRoutes = require('./routes/rewards.routes');
const assetRoutes = require('./routes/asset.routes');

// ============================================================
// USE ROUTES
// ============================================================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/leave', leaveRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/cpd', cpdRoutes);
app.use('/api/v1/appraisal', appraisalRoutes);
app.use('/api/v1/exit', exitRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/email', emailRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/notifications', notificationRoutes.router);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/recruitment', recruitmentRoutes);
app.use('/api/v1/lms', lmsRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/rewards', rewardsRoutes);
app.use('/api/v1/assets', assetRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'HRMS Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// TEST DB
// ============================================================

const db = require('./config/db');

app.get('/api/v1/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1+1 as result');
    res.json({ success: true, message: 'Database connected!', result: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/api/v1/health`);
  console.log(`✅ All routes loaded!`);
});
const holidayRoutes = require('./routes/holiday.routes');
app.use('/api/v1/holidays', holidayRoutes);