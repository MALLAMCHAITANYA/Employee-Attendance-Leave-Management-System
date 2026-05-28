import express from 'express';
import {
  createLeave,
  getMyLeaves,
  getLeaveBalance,
  getLeaveTypes,
  getPendingLeaves,
  updateLeaveStatus,
  cancelLeave
} from '../controllers/leaveController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roles.js';

const router = express.Router();

router.post('/', protect, createLeave);
router.post('/:id/cancel', protect, cancelLeave);
router.get('/me', protect, getMyLeaves);
router.get('/balance', protect, getLeaveBalance);
router.get('/types', protect, getLeaveTypes);

// Manager/admin
router.get(
  '/pending',
  protect,
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  getPendingLeaves
);

router.patch(
  '/:id/status',
  protect,
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  updateLeaveStatus
);

export default router;

