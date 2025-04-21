import express from 'express';
import { register, login, getProfile, verifyToken, checkBanStatus } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/profile
router.get('/profile', authenticateToken, getProfile);

// GET /api/auth/verify - verify token and check if user is banned
router.get('/verify', authenticateToken, verifyToken);

// GET /api/auth/check-ban/:userId - Check if a specific user is banned
router.get('/check-ban/:userId', authenticateToken, checkBanStatus);

export default router; 