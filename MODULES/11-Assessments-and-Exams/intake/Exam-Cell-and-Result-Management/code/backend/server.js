import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './src/config/db.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';

import authRoutes from './src/routes/authRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import examRoutes from './src/routes/examRoutes.js';
import questionRoutes from './src/routes/questionRoutes.js';
import blueprintRoutes from './src/routes/blueprintRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import classRoutes from './src/routes/classRoutes.js';
import paperRoutes from './src/routes/paperRoutes.js';
import seatingRoutes from './src/routes/seatingRoutes.js';
import invigilationRoutes from './src/routes/invigilationRoutes.js';
import hallTicketRoutes from './src/routes/hallTicketRoutes.js';
import { verifyHallTicketPublic } from './src/controllers/hallTicketController.js';
import omrRoutes from './src/routes/omrRoutes.js';
import markRoutes from './src/routes/markRoutes.js';
import resultRoutes from './src/routes/resultRoutes.js';
import reportsRoutes from './src/routes/reportsRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import auditLogRoutes from './src/routes/auditLogRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'ECRMS API' }));

// Public, unauthenticated endpoint — what a hall ticket's QR code links to.
app.get('/api/verify/hallticket/:ticketNo', verifyHallTicketPublic);

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/blueprints', blueprintRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/seating', seatingRoutes);
app.use('/api/invigilation', invigilationRoutes);
app.use('/api/hall-tickets', hallTicketRoutes);
app.use('/api/omr', omrRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`ECRMS API running on port ${PORT}`));
};

start();
