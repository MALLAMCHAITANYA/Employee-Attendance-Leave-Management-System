import express from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  markAnnouncementRead
} from '../controllers/announcementController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roles.js';

const router = express.Router();

router.get('/', protect, getAnnouncements);
router.post('/', protect, requireRole(ROLES.MANAGER, ROLES.ADMIN), createAnnouncement);
router.post('/:id/read', protect, markAnnouncementRead);
router.delete('/:id', protect, requireRole(ROLES.MANAGER, ROLES.ADMIN), deleteAnnouncement);

export default router;
