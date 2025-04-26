import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { Server as HTTPServer } from 'http';
import logger from '../config/logger';

/**
 * Socket Server Configuration
 * 
 * This module initializes a Socket.IO server that handles real-time messaging
 * and user status updates between clients.
 */

const prisma = new PrismaClient();
const users = new Map<string, string>(); // Maps userId to socketId

/**
 * Initialize Socket.IO server with the HTTP server instance
 * @param {HTTPServer} server - The HTTP server to attach Socket.IO to
 * @returns {Server} The configured Socket.IO server instance
 */
const initSocketServer = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000, // Increased timeout for better connection stability
    connectionStateRecovery: {
      // Enable connection state recovery
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true
    }
  });

  /**
   * Handle socket connection events
   * Every client must connect with a userId query parameter
   */
  io.on('connection', async (socket) => {
    const userId = socket.handshake.query.userId;
    
    if (!userId || typeof userId !== 'string') {
      logger.warn(`Socket connection attempt without userId: ${socket.id}`);
      socket.disconnect(true);
      return;
    }

    try {
      // Store user connection
      users.set(userId, socket.id);
      logger.info(`User connected: ${userId}, socketId: ${socket.id}`);
      
      // Update user status in database
      await prisma.user.update({
        where: { id: userId },
        data: { 
          updatedAt: new Date() 
        }
      });

      // Broadcast user online status
      io.emit('userStatus', { userId, status: 'online' });

      /**
       * EVENT: getOnlineUsers
       * Returns the list of currently online user IDs
       * 
       * @emits onlineUsers - With an array of online user IDs
       */
      socket.on('getOnlineUsers', () => {
        const onlineUserIds = Array.from(users.keys());
        logger.debug(`User ${userId} requested online users list. Currently online: ${onlineUserIds.length} users`);
        socket.emit('onlineUsers', { users: onlineUserIds });
      });

      /**
       * EVENT: authenticate
       * Verifies that the user is who they claim to be
       * 
       * @param {string} authenticatedUserId - The userId to authenticate
       * @emits userStatus - Broadcasts user's online status upon successful authentication
       */
      socket.on('authenticate', (authenticatedUserId: string) => {
        // Verify that the user ID matches
        if (authenticatedUserId === userId) {
          logger.info(`User authenticated: ${userId}`);
          // Now we can be sure the user is who they claim to be
          // Broadcast their online status again to all connected clients
          io.emit('userStatus', { userId, status: 'online' });
        } else {
          logger.warn(`Authentication mismatch for user ${userId}`);
          socket.disconnect(true);
        }
      });

      /**
       * EVENT: userOffline
       * Handles a user explicitly marking themselves as offline
       * 
       * @param {Object} data - Contains userId
       * @param {string} data.userId - The ID of the user going offline
       * @emits userStatus - Broadcasts user's offline status
       */
      socket.on('userOffline', (data: { userId: string }) => {
        if (data.userId === userId) {
          // Update status in database
          prisma.user.update({
            where: { id: userId },
            data: { updatedAt: new Date() }
          }).catch(error => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Error updating user status: ${errorMessage}`);
          });
          
          // Broadcast offline status
          io.emit('userStatus', { userId, status: 'offline' });
        }
      });

      /**
       * EVENT: privateMessage
       * Handles sending a private message to another user
       * 
       * @param {Object} data - Message data
       * @param {string} data.content - The message content
       * @param {string} data.receiverId - The recipient's user ID
       * @param {string} [data.tempId] - Optional temporary ID for optimistic updates
       * 
       * @emits newMessage - Sends the created message to both sender and receiver
       * @emits messageDelivered - Confirms message delivery to the sender
       * @emits messageSent - Confirms message was saved but receiver is offline
       * @emits messageError - Indicates an error in message processing
       */
      socket.on('privateMessage', async (data: { content: string; receiverId: string; tempId?: string }) => {
        try {
          const { content, receiverId, tempId } = data;
          
          if (!content || !receiverId) {
            logger.warn(`Invalid message data from user ${userId}`);
            socket.emit('messageError', { error: 'Invalid message data', tempId });
            return;
          }

          // Check if receiver exists
          const receiver = await prisma.user.findUnique({
            where: { id: receiverId }
          });
          
          if (!receiver) {
            logger.warn(`User ${userId} tried to message non-existent user ${receiverId}`);
            socket.emit('messageError', { error: 'Receiver not found', tempId });
            return;
          }

          logger.info(`[Message] From ${userId} to ${receiverId}: ${content.substring(0, 20)}${content.length > 20 ? '...' : ''}`);

          // Create message in database
          const message = await prisma.message.create({
            data: {
              content,
              senderId: userId,
              receiverId,
              read: false
            },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              },
              receiver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              }
            }
          });

          logger.debug(`[Message] Created message in DB with ID: ${message.id}`);

          // Create chat room name
          const roomName = [userId, receiverId].sort().join('-');

          // Try to send to the room first
          io.to(roomName).emit('newMessage', message);
          logger.debug(`[Message] Emitted to room ${roomName}`);
          
          // Also send directly to each socket to ensure delivery
          const receiverSocketId = users.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', message);
            logger.debug(`[Message] Direct emit to receiver socket ${receiverSocketId}`);
            
            // Notify sender of delivery
            socket.emit('messageDelivered', { messageId: message.id, tempId });
          } else {
            // Receiver is offline, just notify sender of successful send
            socket.emit('messageSent', { messageId: message.id, tempId });
            logger.debug(`[Message] Receiver offline, sent messageSent confirmation`);
          }
          
          // Always emit back to sender's socket as well to ensure they see their own message
          socket.emit('newMessage', message);
          logger.debug(`[Message] Direct emit back to sender socket ${socket.id}`);

        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Error sending private message: ${errorMessage}`);
          socket.emit('messageError', { 
            error: 'Failed to send message', 
            tempId: data?.tempId
          });
        }
      });

      /**
       * EVENT: messageRead
       * Marks a message as read and notifies the sender
       * 
       * @param {Object} data - Contains messageId
       * @param {string} data.messageId - The ID of the message that was read
       * 
       * @emits messageRead - Notifies the message sender that their message was read
       * @emits error - Indicates an error in processing the read receipt
       */
      socket.on('messageRead', async (data: { messageId: string }) => {
        try {
          const { messageId } = data;
          
          if (!messageId) {
            logger.warn(`Invalid message ID for read receipt from user ${userId}`);
            socket.emit('error', { error: 'Invalid message ID' });
            return;
          }
          
          const message = await prisma.message.findUnique({
            where: { id: messageId }
          });
          
          if (!message) {
            logger.warn(`Message not found for read receipt: ${messageId}`);
            socket.emit('error', { error: 'Message not found' });
            return;
          }
          
          // Make sure the message is for this user
          if (message.receiverId !== userId) {
            logger.warn(`Unauthorized read receipt from ${userId} for message ${messageId}`);
            socket.emit('error', { error: 'Unauthorized access to message' });
            return;
          }
          
          // Update read status
          await prisma.message.update({
            where: { id: messageId },
            data: { read: true }
          });
          
          logger.debug(`[Message] Marked message ${messageId} as read by ${userId}`);
          
          // Notify the sender if online
          const senderSocketId = users.get(message.senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit('messageRead', { messageId });
            logger.debug(`[Message] Notified sender ${message.senderId} that message was read`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Error marking message as read: ${errorMessage}`);
          socket.emit('error', { error: 'Failed to mark message as read' });
        }
      });

      /**
       * EVENT: typing
       * Notifies the receiver that the user is typing a message
       * 
       * @param {Object} data - Contains receiverId
       * @param {string} data.receiverId - The ID of the user who should receive the typing notification
       * 
       * @emits userTyping - Notifies that a user is typing
       */
      socket.on('typing', (data: { receiverId: string }) => {
        const { receiverId } = data;
        logger.debug(`[Typing] User ${userId} is typing to ${receiverId}`);

        // Create a room name for this conversation
        const roomName = [userId, receiverId].sort().join('-');
        
        // Emit to the room so anyone in this conversation can see the typing status
        io.to(roomName).emit('userTyping', { userId });
        
        // Also emit directly to the receiver's socket to ensure delivery
        const receiverSocketId = users.get(receiverId);
        if (receiverSocketId) {
            logger.debug(`[Typing] Emitting typing status directly to socket ${receiverSocketId}`);
            io.to(receiverSocketId).emit('userTyping', { userId });
        } else {
            logger.debug(`[Typing] Receiver ${receiverId} not connected, typing status not delivered directly`);
        }
      });
      
      /**
       * EVENT: stopTyping
       * Notifies the receiver that the user has stopped typing
       * 
       * @param {Object} data - Contains receiverId
       * @param {string} data.receiverId - The ID of the user who should receive the stop typing notification
       * 
       * @emits stopTyping - Notifies that a user has stopped typing
       */
      socket.on('stopTyping', (data: { receiverId: string }) => {
        const { receiverId } = data;
        logger.debug(`[Typing] User ${userId} stopped typing to ${receiverId}`);
        
        // Create a room name for this conversation
        const roomName = [userId, receiverId].sort().join('-');
        
        // Emit to the room
        io.to(roomName).emit('stopTyping', { userId });
        
        // Also emit directly to the receiver's socket
        const receiverSocketId = users.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('stopTyping', { userId });
        }
      });

      /**
       * EVENT: joinChat
       * Joins a user to a chat room with another user
       * 
       * @param {Object} data - Contains user IDs
       * @param {string} data.userId - The current user's ID
       * @param {string} data.otherUserId - The other user's ID
       * 
       * @emits userJoinedChat - Notifies the other user that this user joined the chat
       */
      socket.on('joinChat', (data: { userId: string; otherUserId: string }) => {
        const { userId, otherUserId } = data;
        
        // Create a room name that's the same regardless of who joins
        // by sorting the IDs alphabetically
        const roomName = [userId, otherUserId].sort().join('-');
        
        socket.join(roomName);
        logger.info(`User ${userId} joined chat room ${roomName}`);
        
        // Let the other user know if they're connected
        const otherUserSocketId = users.get(otherUserId);
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit('userJoinedChat', { userId });
        }
      });
      
      /**
       * EVENT: leaveChat
       * Removes a user from a chat room with another user
       * 
       * @param {Object} data - Contains user IDs
       * @param {string} data.userId - The current user's ID
       * @param {string} data.otherUserId - The other user's ID
       * 
       * @emits userLeftChat - Notifies the other user that this user left the chat
       */
      socket.on('leaveChat', (data: { userId: string; otherUserId: string }) => {
        const { userId, otherUserId } = data;
        
        // Create the same room name
        const roomName = [userId, otherUserId].sort().join('-');
        
        socket.leave(roomName);
        logger.info(`User ${userId} left chat room ${roomName}`);
        
        // Let the other user know
        const otherUserSocketId = users.get(otherUserId);
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit('userLeftChat', { userId });
        }
      });

      /**
       * EVENT: disconnect
       * Handles user disconnection
       * 
       * @emits userStatus - Broadcasts user's offline status after a delay
       */
      socket.on('disconnect', async () => {
        try {
          users.delete(userId);
          logger.info(`User disconnected: ${userId}`);

          // Update user status in database
          await prisma.user.update({
            where: { id: userId },
            data: { 
              updatedAt: new Date()
            }
          });

          // Broadcast user offline status
          // Only emit offline status after a short delay to handle page refreshes
          setTimeout(() => {
            // Check if the user reconnected during the delay
            if (!users.has(userId)) {
              io.emit('userStatus', { userId, status: 'offline' });
            }
          }, 5000);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Error handling disconnection: ${errorMessage}`);
        }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Socket initialization error: ${errorMessage}`);
      socket.disconnect(true);
    }
  });

  return io;
};

export default initSocketServer;
