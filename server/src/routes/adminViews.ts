import express from 'express';
import { 
  getDashboardView, 
  getUsersView, 
  getPostsView, 
  getEarlyBirdView,
  postBanUser,
  postUnbanUser,
  postDeletePost,
  postSelectEarlyBirdSignups,
  postApproveEarlyBirdSignups,
  getAdminLogin,
  postAdminLogin,
  getAdminLogout
} from '../controllers/adminViewController';
import { checkAdminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Admin login
router.get('/login', getAdminLogin);
router.post('/login', postAdminLogin);
router.get('/logout', getAdminLogout);

// Protected admin routes
router.get('/', checkAdminAuth, getDashboardView);
router.get('/users', checkAdminAuth, getUsersView);
router.get('/posts', checkAdminAuth, getPostsView);
router.get('/early-bird', checkAdminAuth, getEarlyBirdView);

// Actions
router.post('/users/:id/ban', checkAdminAuth, postBanUser);
router.post('/users/:id/unban', checkAdminAuth, postUnbanUser);
router.post('/posts/:id/delete', checkAdminAuth, postDeletePost);
router.post('/early-bird/select', checkAdminAuth, postSelectEarlyBirdSignups);
router.post('/early-bird/approve', checkAdminAuth, postApproveEarlyBirdSignups);

export default router; 