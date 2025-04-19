import express from 'express';
import { createPost, getPosts, getPost, deletePost } from '../controllers/postController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticateToken, createPost);
router.get('/', authenticateToken, getPosts);
router.get('/:id', authenticateToken, getPost);
router.delete('/:id', authenticateToken, deletePost);

export default router; 