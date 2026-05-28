import express from 'express';
import {
  setup2FA,
  verify2FA,
  disable2FA,
  login2FA
} from '../controllers/twoFactorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/setup', protect, setup2FA);
router.post('/verify', protect, verify2FA);
router.post('/disable', protect, disable2FA);
router.post('/login', login2FA);

export default router;
