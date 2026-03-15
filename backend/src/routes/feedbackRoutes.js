import express from 'express';
import { submitFeedback, getAllFeedback } from '../controllers/feedbackController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roles.js';

const router = express.Router();

router.post('/', protect, submitFeedback);

router.get(
  '/all',
  protect,
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  getAllFeedback
);

export default router;
