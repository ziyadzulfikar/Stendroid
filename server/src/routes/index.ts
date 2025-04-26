import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

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

// Search users endpoint
router.get('/users/search', authenticateToken, async (req, res, next) => {
  try {
    const query = req.query.q as string;
    const currentUserId = res.locals.userId;
    
    if (!currentUserId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        message: 'Search query must be at least 2 characters long',
        success: false 
      });
    }
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ],
        id: { not: currentUserId } // Exclude current user
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
      take: 10 // Limit results
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ 
      message: 'Failed to search users', 
      success: false 
    });
  }
});

// Message routes - protected by authentication
router.get('/messages/:userId', authenticateToken, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = res.locals.userId;
    
    // Ensure the user is only accessing their own messages
    if (!currentUserId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          // Messages sent by currentUser to userId
          { 
            senderId: currentUserId,
            receiverId: userId 
          },
          // Messages received by currentUser from userId
          { 
            senderId: userId,
            receiverId: currentUserId 
          }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

router.post('/messages', authenticateToken, async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = res.locals.userId;
    
    if (!senderId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });
    
    if (!receiver) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true
          }
        }
      }
    });
    
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

// Add a route to get conversations
router.get('/conversations', authenticateToken, async (req, res, next) => {
  try {
    const userId = res.locals.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Find all unique conversations the user is involved in
    const sentMessages = await prisma.message.findMany({
      where: { senderId: userId },
      distinct: ['receiverId'],
      orderBy: { createdAt: 'desc' },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true
          }
        }
      }
    });
    
    const receivedMessages = await prisma.message.findMany({
      where: { receiverId: userId },
      distinct: ['senderId'],
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true
          }
        }
      }
    });
    
    // Combine and deduplicate conversations
    const conversations = [];
    const conversationMap = new Map();
    
    // Process sent messages
    for (const message of sentMessages) {
      const otherUser = message.receiver;
      if (!conversationMap.has(otherUser.id)) {
        conversationMap.set(otherUser.id, {
          id: otherUser.id,
          user: otherUser,
          lastMessage: message
        });
      }
    }
    
    // Process received messages
    for (const message of receivedMessages) {
      const otherUser = message.sender;
      if (!conversationMap.has(otherUser.id) || 
          new Date(message.createdAt) > new Date(conversationMap.get(otherUser.id).lastMessage.createdAt)) {
        conversationMap.set(otherUser.id, {
          id: otherUser.id,
          user: otherUser,
          lastMessage: message
        });
      }
    }
    
    // Convert map to array and format for client
    for (const [, conversation] of conversationMap) {
      conversations.push({
        id: `conv-${conversation.id}`, // Generate a stable conversation ID
        userId: conversation.id, // User ID of the other participant
        userName: conversation.user.name,
        userAvatar: conversation.user.avatar,
        userEmail: conversation.user.email,
        lastMessage: conversation.lastMessage.content,
        timestamp: conversation.lastMessage.createdAt
      });
    }
    
    // Sort by most recent message
    conversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json(conversations);
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// Protected route - requires authentication
router.post('/posts', authenticateToken, async (req, res, next) => {
  try {
    const { content } = req.body;
    const userId = res.locals.userId; // Get the authenticated user's ID
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Post content is required' });
    }
    
    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        authorId: userId
      },
      include: {
        author: true
      }
    });
    
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

export default router; 