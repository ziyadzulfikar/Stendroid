'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  delivered?: boolean;
  read?: boolean;
  pending?: boolean;
  error?: boolean;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  receiver?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface UserStatus {
  userId: string;
  status: 'online' | 'offline';
}

// Connection status states
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface MessagingContextType {
  messages: Message[];
  sendMessage: (content: string, receiverId: string) => void;
  typingUsers: Record<string, boolean>;
  onlineUsers: Set<string>;
  setActiveConversation: (userId: string) => void;
  activeConversation: string | null;
  notifyTyping: (receiverId: string) => void;
  loadingMessages: boolean;
  connectionStatus: ConnectionStatus;
  markAsRead: (messageId: string) => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [typingDebounceTimers, setTypingDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});

  // Initialize WebSocket connection
  useEffect(() => {
    console.log("Initializing socket connection...");
    
    // Get current user from localStorage
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      console.error("No user found in localStorage");
      return;
    }
    
    try {
      const userData = JSON.parse(userJson);
      setCurrentUserId(userData.id);
      
      setConnectionStatus('connecting');
      
      // Create socket connection with reconnection options
      const socketInstance = io(`${API_URL}`, {
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        query: { userId: userData.id }
      });
      
      setSocket(socketInstance);
      console.log("Socket instance created");
      
      // Handle connection events
      socketInstance.on('connect', () => {
        console.log('Socket connected successfully');
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        
        // Authenticate with the socket server
        socketInstance.emit('authenticate', userData.id);
        
        // Request initial online users list
        socketInstance.emit('getOnlineUsers');
      });
      
      // Clean up on unmount
      return () => {
        console.log("Cleaning up socket connection");
        if (socketInstance.connected) {
          socketInstance.disconnect();
        }
      };
    } catch (error) {
      console.error('Error initializing messaging:', error);
      setConnectionStatus('error');
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    console.log("Setting up socket event listeners");
    
    // Handle new incoming messages
    const handleNewMessage = (message: Message) => {
      console.log('SOCKET: New message received:', message);
      
      // Always add message to state regardless of active conversation
      setMessages(prev => {
        // Avoid duplicate messages
        if (prev.some(m => m.id === message.id)) {
          console.log('Duplicate message skipped:', message.id);
          return prev;
        }
        console.log('Adding new message to state:', message.id);
        return [...prev, message];
      });
      
      // If the message is from the other user and we're in the active conversation, mark it as read
      if (activeConversation && message.senderId === activeConversation) {
        socket.emit('markAsRead', { messageId: message.id });
      }
    };
    
    // Handle online users list
    const handleOnlineUsers = (data: { users: string[] }) => {
      console.log('SOCKET: Online users received:', data.users);
      const onlineUsersSet = new Set(data.users);
      setOnlineUsers(onlineUsersSet);
    };
    
    // Handle user status changes
    const handleUserStatus = (data: UserStatus) => {
      console.log('SOCKET: User status update:', data);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.status === 'online') {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    };
    
    // Handle typing indicators
    const handleUserTyping = (data: { userId: string }) => {
      console.log('SOCKET: User typing:', data.userId);
      setTypingUsers(prev => {
        // Create a new object to force React to detect the state change
        const newTypingUsers = { ...prev };
        newTypingUsers[data.userId] = true;
        
        // Automatically clear typing indicator after 3 seconds of inactivity
        setTimeout(() => {
          setTypingUsers(current => {
            // Only clear if it's still set to true
            if (current[data.userId]) {
              console.log(`Clearing typing status for ${data.userId} after timeout`);
              const updated = { ...current };
              delete updated[data.userId];
              return updated;
            }
            return current;
          });
        }, 3000);
        
        return newTypingUsers;
      });
    };
    
    // Attach event listeners
    socket.on('newMessage', handleNewMessage);
    socket.on('onlineUsers', handleOnlineUsers);
    socket.on('userStatus', handleUserStatus);
    socket.on('userTyping', handleUserTyping);
    
    // Handle message sent confirmation
    socket.on('messageSent', (data: { messageId: string; tempId?: string }) => {
      console.log('SOCKET: Message sent confirmation:', data);
      // Replace temporary message with confirmed message
      if (data.tempId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === data.tempId 
              ? { ...msg, id: data.messageId, pending: false, delivered: true } 
              : msg
          )
        );
      }
    });
    
    // Handle message delivered confirmation
    socket.on('messageDelivered', (data: { messageId: string; tempId?: string }) => {
      console.log('SOCKET: Message delivered confirmation:', data);
      // Replace temporary message with confirmed message if tempId is provided
      if (data.tempId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === data.tempId 
              ? { ...msg, id: data.messageId, pending: false, delivered: true } 
              : msg
          )
        );
      } else {
        // Otherwise just mark the message as delivered
        setMessages(prev => 
          prev.map(msg => 
            msg.id === data.messageId 
              ? { ...msg, delivered: true } 
              : msg
          )
        );
      }
    });
    
    // Handle message read confirmation
    socket.on('messageRead', (data: { messageId: string }) => {
      console.log('SOCKET: Message read confirmation:', data);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, read: true } 
            : msg
        )
      );
    });
    
    // Return cleanup function
    return () => {
      console.log("Removing socket event listeners");
      socket.off('newMessage', handleNewMessage);
      socket.off('onlineUsers', handleOnlineUsers);
      socket.off('userStatus', handleUserStatus);
      socket.off('userTyping', handleUserTyping);
      socket.off('messageSent');
      socket.off('messageDelivered');
      socket.off('messageRead');
    };
  }, [socket, activeConversation, currentUserId]);

  // Load conversation history when active conversation changes
  useEffect(() => {
    if (!activeConversation || !currentUserId) return;
    
    const fetchMessages = async () => {
      try {
        console.log(`Fetching messages for conversation with ${activeConversation}`);
        setLoadingMessages(true);
        const token = localStorage.getItem('token');
        
        if (!token) return;
        
        // Use activeConversation directly as it now contains the other user's ID
        const response = await fetch(`${API_URL}/api/messages/${activeConversation}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Fetched ${data.length} messages from API`);
          setMessages(data);
          
          // Mark all unread messages from the other user as read
          data.forEach((message: Message) => {
            if (message.senderId === activeConversation && !message.read) {
              socket?.emit('markAsRead', { messageId: message.id });
            }
          });
          
          // Update UI immediately to show messages as read
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.senderId === activeConversation ? { ...msg, read: true } : msg
            )
          );
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };
    
    fetchMessages();
    
    // Join chat room for real-time updates
    if (socket && socket.connected) {
      console.log(`Joining chat room with ${activeConversation}`);
      socket.emit('joinChat', { userId: currentUserId, otherUserId: activeConversation });
    }
    
    // Leave chat room when conversation changes or component unmounts
    return () => {
      if (socket && socket.connected) {
        console.log(`Leaving chat room with ${activeConversation}`);
        socket.emit('leaveChat', { userId: currentUserId, otherUserId: activeConversation });
      }
    };
  }, [activeConversation, currentUserId, socket]);

  // Send a message - defined as a useCallback to avoid recreating on every render
  const sendMessage = useCallback((content: string, receiverId: string) => {
    if (!socket || !currentUserId || !content.trim()) return;
    
    console.log(`Sending message to ${receiverId}: ${content.substring(0, 20)}${content.length > 20 ? '...' : ''}`);
    
    // Generate temporary ID for the message
    const tempId = `temp-${Date.now()}`;
    
    // Add optimistic message to the UI
    const optimisticMessage: Message = {
      id: tempId,
      content,
      senderId: currentUserId,
      receiverId,
      createdAt: new Date().toISOString(),
      delivered: false,
      read: false,
      pending: true // Flag to indicate it's an optimistic update
    };
    
    // Update messages state with the optimistic message
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Send the actual message over socket
    socket.emit('privateMessage', {
      tempId,
      content,
      receiverId
    });
    
    // Set up timeout to handle failed message delivery
    setTimeout(() => {
      setMessages(prev => {
        const stillPending = prev.find(m => m.id === tempId && m.pending);
        if (stillPending) {
          console.log(`Message ${tempId} still pending after timeout, marking as error`);
          return prev.map(m => 
            m.id === tempId 
              ? { ...m, error: true, pending: false } 
              : m
          );
        }
        return prev;
      });
    }, 10000);
  }, [socket, currentUserId]);

  // Notify when typing - update to be more reliable
  const notifyTyping = useCallback((receiverId: string) => {
    if (!socket || !currentUserId) return;
    
    console.log(`Sending typing notification to ${receiverId}`);
    
    // Throttle typing notifications to avoid flooding
    if (!typingDebounceTimers[receiverId]) {
      // Send typing notification to the server
      socket.emit('typing', {
        receiverId
      });
      
      // Set a timer to prevent sending too many typing events
      const newTimer = setTimeout(() => {
        setTypingDebounceTimers(prev => {
          const updated = { ...prev };
          delete updated[receiverId];
          return updated;
        });
        
        // Send stop typing event after the debounce period
        if (socket && socket.connected) {
          socket.emit('stopTyping', { receiverId });
        }
      }, 2000); // Send at most one typing event every 2 seconds
      
      setTypingDebounceTimers(prev => ({
        ...prev,
        [receiverId]: newTimer
      }));
    }
  }, [socket, currentUserId, typingDebounceTimers]);

  return (
    <MessagingContext.Provider
      value={{
        messages,
        sendMessage,
        typingUsers,
        onlineUsers,
        setActiveConversation,
        activeConversation,
        notifyTyping,
        loadingMessages,
        connectionStatus,
        markAsRead: (messageId: string) => {
          if (!socket) return;
          socket.emit('markAsRead', { messageId });
        }
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};
