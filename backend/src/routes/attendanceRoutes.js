import express from 'express';
import {
  getMyAttendance,
  getMyAttendanceSummary,
  signIn,
  signOut,
  exportAttendance,
  getTeamAttendance,
  getTeamAttendanceReport
} from '../controllers/attendanceController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roles.js';

const router = express.Router();

router.get('/me', protect, getMyAttendance);
router.get('/summary', protect, getMyAttendanceSummary);
router.get('/export', protect, exportAttendance);
router.post('/signin', protect, signIn);
router.post('/signout', protect, signOut);

router.get('/team', protect, requireRole(ROLES.MANAGER, ROLES.ADMIN), getTeamAttendance);
router.get('/report', protect, requireRole(ROLES.MANAGER, ROLES.ADMIN), getTeamAttendanceReport);

export default router;

