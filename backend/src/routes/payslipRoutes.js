import express from 'express';
import {
  getMyPayslips,
  getEmployeePayslips,
  createPayslip,
  deletePayslip
} from '../controllers/payslipController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roles.js';

const router = express.Router();

router.get('/my', protect, getMyPayslips);
router.get('/employee/:id', protect, requireRole(ROLES.MANAGER, ROLES.ADMIN), getEmployeePayslips);
router.post('/', protect, requireRole(ROLES.ADMIN), createPayslip);
router.delete('/:id', protect, requireRole(ROLES.ADMIN), deletePayslip);

export default router;
