import express from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
// We'll add password hashing later (e.g., using bcrypt)
// import bcrypt from 'bcrypt'; 
// We'll add JWT later
// import jwt from 'jsonwebtoken';

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/profile
router.get('/profile', authenticateToken, getProfile);

export default router; 