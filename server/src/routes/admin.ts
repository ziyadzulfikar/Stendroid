import express from 'express';
import { 
  getDashboardStats, 
  getUsers, 
  getPosts, 
  deletePost, 
  banUser, 
  unbanUser,
  getEarlyBirdSignups, 
  bulkApproveEarlyBirdSignups,
  toggleUserAdmin
} from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware to check if user is admin
const isAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const userId = res.locals.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    });
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const router = express.Router();

// TEMPORARY: Create admin user with secret key (remove after use)
// This endpoint does NOT require authentication - it uses a secret key instead
router.post('/create-admin', async (req, res) => {
  try {
    // Check for secret key in request body
    const { email, password, name, secretKey } = req.body;
    
    // Verify the secret key matches (set this to something very unique)
    const correctSecretKey = process.env.ADMIN_SECRET_KEY || 'temp_very_secret_key_12345';
    
    if (secretKey !== correctSecretKey) {
      return res.status(401).json({ message: 'Unauthorized: Invalid secret key' });
    }
    
    // Import required modules directly in this route handler
    const bcrypt = require('bcryptjs');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the admin user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        isAdmin: true
      }
    });
    
    // Return success (without the password)
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({ 
      message: 'Admin user created successfully',
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({ message: 'Error creating admin user' });
  }
});

// All admin routes require authentication
router.use(authenticateToken);

// Dashboard overview
router.get('/dashboard', isAdmin, getDashboardStats);
router.get('/dashboard/stats', isAdmin, getDashboardStats);

// User management
router.get('/users', isAdmin, getUsers);
router.put('/users/:id/ban', isAdmin, banUser);
router.put('/users/:id/unban', isAdmin, unbanUser);
router.put('/users/:id/toggle-admin', isAdmin, toggleUserAdmin);

// Post management
router.get('/posts', isAdmin, getPosts);
router.delete('/posts/:id', isAdmin, deletePost);

// Early bird signup management
router.get('/early-bird', isAdmin, getEarlyBirdSignups);
router.post('/early-bird/approve', isAdmin, bulkApproveEarlyBirdSignups);

export default router; 