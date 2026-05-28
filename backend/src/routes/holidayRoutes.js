import express from 'express';
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday
} from '../controllers/holidayController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roles.js';

const router = express.Router();

router.get('/', protect, getHolidays);
router.post('/', protect, requireRole(ROLES.ADMIN), createHoliday);
router.put('/:id', protect, requireRole(ROLES.ADMIN), updateHoliday);
router.delete('/:id', protect, requireRole(ROLES.ADMIN), deleteHoliday);

export default router;
