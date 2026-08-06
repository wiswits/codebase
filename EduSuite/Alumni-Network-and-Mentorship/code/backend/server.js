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
const alumniRoutes = require('./routes/alumni.routes');
const mentorshipRoutes = require('./routes/mentorship.routes');

// ============================================================
// USE ROUTES
// ============================================================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/alumni', alumniRoutes);
app.use('/api/v1/mentorship', mentorshipRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Alumni Backend is running!',
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
  console.log(`🔐 Auth: http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`👥 Alumni: http://localhost:${PORT}/api/v1/alumni/directory`);
  console.log(`✅ All routes loaded!`);
});
const eventsRoutes = require('./routes/events.routes');
app.use('/api/v1/events', eventsRoutes);
const storiesRoutes = require('./routes/stories.routes');
app.use('/api/v1/stories', storiesRoutes);
const donationsRoutes = require('./routes/donations.routes');
app.use('/api/v1/donations', donationsRoutes);
const importRoutes = require('./routes/import.routes');
app.use('/api/v1/import', importRoutes);
const reunionsRoutes = require('./routes/reunions.routes');
app.use('/api/v1/reunions', reunionsRoutes);