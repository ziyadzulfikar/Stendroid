import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import prisma from './database';

// Map to track online users (userId -> socketId)
const onlineUsers = new Map<string, string>();

export function setupSocketServer(server: HttpServer) {
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New socket connection:', socket.id);
    
    // Handle user authentication and set online status
    socket.on('authenticate', async (userId: string) => {
      if (!userId) return;
      
      console.log(`User ${userId} authenticated via socket`);
      
      // Store the user's socket ID
      onlineUsers.set(userId, socket.id);
      
      // Notify all users that this user is online
      io.emit('userStatus', { userId, status: 'online' });
    });
    
    // Handle private messages
    socket.on('privateMessage', async (data: { 
      content: string; 
      senderId: string; 
      receiverId: string;
    }) => {
      try {
        const { content, senderId, receiverId } = data;
        
        // Validate message data
        if (!content || !senderId || !receiverId) {
          socket.emit('messageError', { error: 'Invalid message data' });
          return;
        }
        
        // Save message to database
        const message = await prisma.message.create({
          data: {
            content,
            senderId,
            receiverId,
            read: false, // Initialize as unread
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
        
        // Send to receiver if they're online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('newMessage', message);
        }
        
        // Send confirmation back to sender
        socket.emit('messageSent', message);
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });
    
    // Handle typing indicators
    socket.on('typing', (data: { senderId: string; receiverId: string }) => {
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('userTyping', { userId: data.senderId });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      // Find the user who disconnected
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          // Remove user from online users
          onlineUsers.delete(userId);
          
          // Notify others that user is offline
          io.emit('userStatus', { userId, status: 'offline' });
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
}
