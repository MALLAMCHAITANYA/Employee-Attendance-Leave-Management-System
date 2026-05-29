import dotenv from 'dotenv';
dotenv.config();

import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import attendanceRoutes from './src/routes/attendanceRoutes.js';
import leaveRoutes from './src/routes/leaveRoutes.js';
import feedbackRoutes from './src/routes/feedbackRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import holidayRoutes from './src/routes/holidayRoutes.js';
import auditLogRoutes from './src/routes/auditLogRoutes.js';
import announcementRoutes from './src/routes/announcementRoutes.js';
import payslipRoutes from './src/routes/payslipRoutes.js';
import documentRoutes from './src/routes/documentRoutes.js';
import twoFactorRoutes from './src/routes/twoFactorRoutes.js';
import { seedHolidays } from './src/controllers/holidayController.js';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();

// Connect to database
connectDB().then(() => {
  seedHolidays();
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json());
app.use(morgan('dev'));

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// Swagger Docs API Setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Work Space API Docs',
      version: '1.0.0',
      description: 'API Documentation for the Employee Attendance & Leave Portal'
    },
    servers: [
      {
        url: 'http://localhost:5000'
      }
    ]
  },
  apis: ['./server.js', './src/routes/*.js']
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/2fa', twoFactorRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/documents', documentRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend static assets in production
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDistPath));

  // Catch-all route to serve the built index.html for React Router
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'Employee Portal API running' });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.statusCode || 500)
    .json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
// Trigger reload

