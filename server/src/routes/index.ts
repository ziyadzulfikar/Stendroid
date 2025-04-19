import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Basic route for testing
router.get('/', (_req, res) => {
  res.json({ message: 'Welcome to LinkedIn Clone API' });
});

// User routes
router.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Message routes
router.get('/messages/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: true,
        receiver: true
      }
    });
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

router.post('/messages', async (req, res, next) => {
  try {
    const { senderId, receiverId, content } = req.body;
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content
      },
      include: {
        sender: true,
        receiver: true
      }
    });
    res.json(message);
  } catch (error) {
    next(error);
  }
});

// Post routes
router.get('/posts', async (_req, res, next) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: true
      }
    });
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

export default router; 