import express from 'express';
import { signupForEarlyAccess, getEarlyBirdSignups, approveEarlyBirdSignup } from '../controllers/earlyBirdController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public endpoint for early bird signup
router.post('/signup', signupForEarlyAccess);

// Admin-only endpoints (protected)
router.get('/', authenticateToken, getEarlyBirdSignups);
router.put('/:id/approve', authenticateToken, approveEarlyBirdSignup);

export default router; 