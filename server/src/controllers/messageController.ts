import { Request, Response } from 'express';
import prisma from '../config/database';

// Get messages between current user and another user
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = res.locals.userId;

    // Validate params
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Update read status for messages sent to current user
    await prisma.message.updateMany({
      where: {
        receiverId: currentUserId,
        senderId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

// Send a message (REST API version, WebSocket is preferred)
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, receiverId } = req.body;
    const senderId = res.locals.userId;

    // Validate input
    if (!content || !receiverId) {
      res.status(400).json({ message: 'Content and receiver ID are required' });
      return;
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });

    if (!receiver) {
      res.status(404).json({ message: 'Receiver not found' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
        read: false, // New messages are always unread
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
};

interface ConversationUser {
  id: string;
  name: string;
  avatar: string | null;
}

interface MessageWithUsers {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  sender: ConversationUser;
  receiver: ConversationUser;
}

// Get all conversations for the current user
export const getConversations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = res.locals.userId;

    // Find all messages where current user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    }) as unknown as MessageWithUsers[];

    // Process messages to get unique conversations
    const conversations: Record<string, any> = {};

    messages.forEach((message) => {
      const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
      const otherUser = message.senderId === currentUserId ? message.receiver : message.sender;

      if (!conversations[otherUserId]) {
        conversations[otherUserId] = {
          id: otherUserId,
          name: otherUser?.name || 'Unknown User',
          avatar: otherUser?.avatar,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: message.senderId !== currentUserId && !message.read ? 1 : 0,
        };
      } else if (new Date(message.createdAt) > new Date(conversations[otherUserId].lastMessageTime)) {
        // Update only if this message is newer
        conversations[otherUserId].lastMessage = message.content;
        conversations[otherUserId].lastMessageTime = message.createdAt;
        
        // Update unread count
        if (message.senderId !== currentUserId && !message.read) {
          conversations[otherUserId].unreadCount += 1;
        }
      } else if (message.senderId !== currentUserId && !message.read) {
        // If the message is unread, increment the unread count
        conversations[otherUserId].unreadCount += 1;
      }
    });

    // Convert to array and sort by most recent message
    const result = Object.values(conversations).sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
};