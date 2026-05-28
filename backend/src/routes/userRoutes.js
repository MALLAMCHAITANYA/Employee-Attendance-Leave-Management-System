import express from 'express';
import { getMe, updateMe, getAllUsers } from '../controllers/userController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roles.js';

const router = express.Router();

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.get('/', protect, requireRole(ROLES.MANAGER, ROLES.ADMIN), getAllUsers);

export default router;

