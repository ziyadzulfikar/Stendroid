import express from 'express';
import { getMessages, sendMessage, getConversations } from '../controllers/messageController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all conversations for current user
router.get('/conversations', authenticateToken, getConversations);

// Get messages between current user and specific user
router.get('/:userId', authenticateToken, getMessages);

// Send a new message
router.post('/', authenticateToken, sendMessage);

export default router; 