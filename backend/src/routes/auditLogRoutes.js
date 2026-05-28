import express from 'express';
import { getAuditLogs } from '../controllers/auditLogController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roles.js';

const router = express.Router();

router.get('/', protect, requireRole(ROLES.ADMIN), getAuditLogs);

export default router;
