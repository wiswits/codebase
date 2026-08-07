const express = require('express');
const cors = require('cors');
const utilizationRoutes = require('./modules/utilization/routes/utilization.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/utilization', utilizationRoutes);

app.get('/', (req, res) => {
  res.send('✅ Utilization Backend is running!');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Utilization Backend is healthy',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error'
    }
  });
});

module.exports = app;