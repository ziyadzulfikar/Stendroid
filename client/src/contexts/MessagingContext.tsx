import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
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

interface MessagingContextType {
  messages: Message[];
  sendMessage: (content: string, receiverId: string) => void;
  typingUsers: Record<string, boolean>;
  onlineUsers: Set<string>;
  setActiveConversation: (userId: string) => void;
  activeConversation: string | null;
  notifyTyping: (receiverId: string) => void;
  loadingMessages: boolean;
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

  // Initialize WebSocket connection
  useEffect(() => {
    // Get current user from localStorage
    const userJson = localStorage.getItem('user');
    if (!userJson) return;
    
    try {
      const userData = JSON.parse(userJson);
      setCurrentUserId(userData.id);
      
      // Create socket connection
      const socketInstance = io(API_URL);
      setSocket(socketInstance);
      
      // Authenticate with the socket server
      socketInstance.emit('authenticate', userData.id);
      
      // Clean up on unmount
      return () => {
        socketInstance.disconnect();
      };
    } catch (error) {
      console.error('Error initializing messaging:', error);
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Handle new incoming messages
    socket.on('newMessage', (message: Message) => {
      // Only add message if it's related to the active conversation
      if (
        activeConversation && 
        (message.senderId === activeConversation || message.receiverId === activeConversation)
      ) {
        setMessages(prev => [...prev, message]);
      }
      
      // Play notification sound if the message is from someone else
      if (message.senderId !== currentUserId) {
        // You would add an actual sound file to your project and uncomment this
        // new Audio('/message-sound.mp3').play().catch(e => console.log(e));
      }
    });
    
    // Handle message sent confirmation
    socket.on('messageSent', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });
    
    // Handle typing indicators
    socket.on('userTyping', (data: { userId: string }) => {
      setTypingUsers(prev => ({ ...prev, [data.userId]: true }));
      
      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => ({ ...prev, [data.userId]: false }));
      }, 3000);
    });
    
    // Handle user status changes
    socket.on('userStatus', (data: UserStatus) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.status === 'online') {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    });
    
    // Handle errors
    socket.on('messageError', (error: { error: string }) => {
      console.error('Message error:', error);
      // You could add toast notifications here
    });
    
    return () => {
      socket.off('newMessage');
      socket.off('messageSent');
      socket.off('userTyping');
      socket.off('userStatus');
      socket.off('messageError');
    };
  }, [socket, activeConversation, currentUserId]);

  // Load conversation history when active conversation changes
  useEffect(() => {
    if (!activeConversation || !currentUserId) return;
    
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const token = localStorage.getItem('token');
        
        if (!token) return;
        
        const response = await fetch(`${API_URL}/api/messages/${activeConversation}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };
    
    fetchMessages();
  }, [activeConversation, currentUserId]);

  // Send a message
  const sendMessage = (content: string, receiverId: string) => {
    if (!socket || !currentUserId || !content.trim()) return;
    
    socket.emit('privateMessage', {
      content,
      senderId: currentUserId,
      receiverId
    });
  };

  // Notify when typing
  const notifyTyping = (receiverId: string) => {
    if (!socket || !currentUserId) return;
    
    socket.emit('typing', {
      senderId: currentUserId,
      receiverId
    });
  };

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
        loadingMessages
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
