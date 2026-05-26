import express from 'express';
import {
  getMyAttendance,
  getMyAttendanceSummary,
  signIn,
  signOut,
  exportAttendance
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', protect, getMyAttendance);
router.get('/summary', protect, getMyAttendanceSummary);
router.get('/export', protect, exportAttendance);
router.post('/signin', protect, signIn);
router.post('/signout', protect, signOut);

export default router;

