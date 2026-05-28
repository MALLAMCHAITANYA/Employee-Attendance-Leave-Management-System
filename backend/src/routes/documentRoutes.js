import express from 'express';
import {
  getDocuments,
  createDocument,
  deleteDocument,
  upload
} from '../controllers/documentController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roles.js';

const router = express.Router();

router.get('/', protect, getDocuments);
router.post(
  '/',
  protect,
  requireRole(ROLES.ADMIN),
  upload.single('file'),
  createDocument
);
router.delete('/:id', protect, requireRole(ROLES.ADMIN), deleteDocument);

export default router;
