import express from 'express';
import { 
  getDashboardStats, 
  getUsers, 
  getPosts, 
  deletePost, 
  banUser, 
  unbanUser,
  getEarlyBirdSignups, 
  bulkApproveEarlyBirdSignups 
} from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';

// For a real admin dashboard, you'd want to add admin role verification middleware
// This is a simplified version without role checking
const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// Dashboard overview
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', getUsers);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);

// Post management
router.get('/posts', getPosts);
router.delete('/posts/:id', deletePost);

// Early bird signup management
router.get('/early-bird', getEarlyBirdSignups);
router.post('/early-bird/approve', bulkApproveEarlyBirdSignups);

export default router; 