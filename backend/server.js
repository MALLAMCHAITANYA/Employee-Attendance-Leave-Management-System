import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import attendanceRoutes from './src/routes/attendanceRoutes.js';
import leaveRoutes from './src/routes/leaveRoutes.js';
import feedbackRoutes from './src/routes/feedbackRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Employee Portal API running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.statusCode || 500)
    .json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

