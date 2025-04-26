'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import UserSearch from '@/components/UserSearch';
import { useMessaging } from '@/contexts/MessagingContext';

// Define the API endpoint URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Make User interface match the one in UserSearch component
interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

interface Conversation {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  isOnline?: boolean;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get messaging context for real-time functionality
  const { 
    messages, 
    sendMessage, 
    typingUsers, 
    onlineUsers, 
    setActiveConversation, 
    activeConversation, 
    notifyTyping,
    loadingMessages,
    connectionStatus 
  } = useMessaging();

  // Filter messages for current conversation
  const filteredMessages = useMemo(() => {
    if (!selectedUserId || !currentUser) return [];
    
    return messages.filter(message => 
      (message.senderId === currentUser.id && message.receiverId === selectedUserId) || 
      (message.receiverId === currentUser.id && message.senderId === selectedUserId)
    );
  }, [messages, selectedUserId, currentUser]);

  // Log message count for debugging
  useEffect(() => {
    console.log(`Filtered messages: ${filteredMessages.length}, All messages: ${messages.length}`);
    if (selectedUserId) {
      console.log(`Showing messages for conversation with user ID: ${selectedUserId}`);
    }
  }, [filteredMessages.length, messages.length, selectedUserId]);

  // Fetch conversations on component mount and periodically
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // Don't show loading state during refresh to prevent UI flicker
        const isInitialLoad = conversations.length === 0;
        if (isInitialLoad) {
          setIsLoading(true);
        }
        
        // Get current user from localStorage
        const userJson = localStorage.getItem('user');
        if (userJson) {
          try {
            const userData = JSON.parse(userJson);
            setCurrentUser(userData);
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          setIsLoading(false);
          return;
        }
        
        // Fetch conversations from API
        const response = await fetch(`${API_URL}/api/conversations`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch conversations: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && Array.isArray(data)) {
          // Transform conversation data to match our interface
          const formattedConversations = data.map((conv: any) => ({
            id: conv.id || `conv-${conv.userId}`,
            userId: conv.userId,
            name: conv.userName || 'Unknown User',
            avatar: conv.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.userName || 'User')}`,
            lastMessage: conv.lastMessage || '',
            timestamp: conv.timestamp || new Date().toISOString(),
            isOnline: onlineUsers?.has(conv.userId) || false
          }));
          
          // Preserve selected conversation during refresh
          setConversations(formattedConversations);
          
          // If a conversation was previously selected (e.g. from URL), try to reselect it
          const urlParams = new URLSearchParams(window.location.search);
          const userId = urlParams.get('userId');
          
          if (userId && !selectedConversation) {
            const foundConversation = formattedConversations.find(c => c.userId === userId);
            if (foundConversation) {
              selectConversation(foundConversation);
              return;
            }
          }
          
          // Otherwise select first conversation if available and none is selected
          if (formattedConversations.length > 0 && !selectedConversation) {
            selectConversation(formattedConversations[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial fetch
    fetchConversations();
    
    // Set up periodic refresh (every 60 seconds)
    const intervalId = setInterval(fetchConversations, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [selectedConversation, onlineUsers]);

  // Scroll to bottom of messages only when messages change
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  
  useEffect(() => {
    if (messagesEndRef.current && shouldScrollToBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldScrollToBottom]);
  
  // Reset shouldScrollToBottom when conversation changes
  useEffect(() => {
    setShouldScrollToBottom(true);
  }, [selectedConversation]);
  
  // Handle scroll events to disable auto-scrolling when user scrolls up
  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // If user has scrolled up more than 100px from bottom, disable auto-scroll
    setShouldScrollToBottom(scrollHeight - scrollTop - clientHeight < 100);
  };

  // Update conversation when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && selectedConversation) {
      const lastMessage = messages[messages.length - 1];
      const conversationUserId = conversations.find(c => c.id === selectedConversation)?.userId;
      
      // Update the last message in the conversation list
      if (conversationUserId && (lastMessage.senderId === conversationUserId || lastMessage.receiverId === conversationUserId)) {
        setConversations(prev => {
          return prev.map(conv => {
            if (conv.userId === conversationUserId || conv.id === selectedConversation) {
              return {
                ...conv,
                lastMessage: lastMessage.content,
                timestamp: lastMessage.createdAt
              };
            }
            return conv;
          });
        });
      }
    }
  }, [messages, selectedConversation]);

  // Update online status of users in conversations
  useEffect(() => {
    if (!onlineUsers) return;
    
    // Update online status for each conversation
    setConversations(prevConversations => 
      prevConversations.map(conv => ({
        ...conv,
        isOnline: onlineUsers.has(conv.userId)
      }))
    );
  }, [onlineUsers]);

  // Handle typing indicator from other users
  useEffect(() => {
    if (!selectedUserId || !typingUsers) return;
    
    // Check if the selected user is typing
    const isUserTyping = typingUsers[selectedUserId];
    console.log(`Typing status for user ${selectedUserId}: ${isUserTyping ? 'typing' : 'not typing'}`);
    setIsTyping(!!isUserTyping);
  }, [typingUsers, selectedUserId]);

  // Function to select a conversation
  const selectConversation = (conversation: Conversation) => {
    console.log(`Selecting conversation with user: ${conversation.userId}`);
    setSelectedConversation(conversation.id);
    setSelectedUserId(conversation.userId);
    
    // Set active conversation in messaging context
    setActiveConversation(conversation.userId);
    
    // Update URL with the user ID parameter without reloading the page
    const url = new URL(window.location.href);
    url.searchParams.set('userId', conversation.userId);
    window.history.pushState({}, '', url);
  };

  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;

    // Send message through the messaging context
    sendMessage(newMessage, conversation.userId);
    
    // Update the conversation in the list with the new message
    const updatedConversation = {
      ...conversation,
      lastMessage: newMessage,
      timestamp: new Date().toISOString()
    };
    
    // Move the updated conversation to the top of the list and update its content
    setConversations(prev => {
      const filteredConversations = prev.filter(conv => conv.id !== selectedConversation);
      return [updatedConversation, ...filteredConversations];
    });
    
    // Clear the input field
    setNewMessage('');
    
    // Cancel any typing notifications when sending the message
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Notify when typing
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // If we have selected a conversation
    if (selectedUserId) {
      // Cancel previous timeout if exists
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      console.log(`Notifying typing to user: ${selectedUserId}`);
      // Send typing notification through context
      notifyTyping(selectedUserId);
      
      // Set timeout to clear typing status after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 3000);
    }
  };

  // Function to start a new conversation from search
  const startNewConversation = async (user: User) => {
    // Check if conversation already exists
    const existingConversation = conversations.find(c => c.userId === user.id);
    
    if (existingConversation) {
      // If exists, select it
      selectConversation(existingConversation);
    } else {
      // Create a new conversation object
      const newConversation: Conversation = {
        id: `conv-${user.id}`, // Use a stable ID format
        userId: user.id,
        name: user.name,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
        lastMessage: '',
        timestamp: new Date().toISOString(),
        isOnline: onlineUsers?.has(user.id) || false
      };
      
      try {
        // Send an initial empty message to create the conversation in backend
        // This is optional but ensures the conversation shows up in the list later
        const token = localStorage.getItem('token');
        if (token && currentUser) {
          // First select the conversation so it becomes active
          setConversations(prev => [newConversation, ...prev]);
          selectConversation(newConversation);
          
          // Then focus the message input
          setTimeout(() => {
            const messageInput = document.querySelector('input[placeholder="Type a message..."]') as HTMLInputElement;
            if (messageInput) {
              messageInput.focus();
            }
          }, 0);
        }
      } catch (error) {
        console.error('Error starting new conversation:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      {/* Connection indicator */}
      {connectionStatus === 'error' && (
        <div className="bg-red-500 text-white text-center py-1">
          Connection error. Messages may not be updated in real-time.
        </div>
      )}
      {connectionStatus === 'reconnecting' && (
        <div className="bg-yellow-500 text-white text-center py-1">
          Reconnecting to chat server...
        </div>
      )}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="flex h-[calc(100vh-12rem)]">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 bg-blue-50">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                <div className="mt-2">
                  <UserSearch onSelectUser={startNewConversation} />
                  <p className="text-xs text-gray-500 mt-1">Search for users to start a conversation</p>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {conversations.length > 0 ? (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                        selectedConversation === conversation.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => selectConversation(conversation)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 relative">
                          <img
                            className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                            src={conversation.avatar}
                            alt={conversation.name}
                          />
                          {conversation.isOnline && (
                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
                          )}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {conversation.timestamp ? 
                                (isToday(conversation.timestamp) 
                                  ? formatTime(conversation.timestamp) 
                                  : formatDate(conversation.timestamp))
                                : ''}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage || 'Start a conversation...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">Search for users to start messaging</p>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="w-2/3 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 relative">
                        <img
                          className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                          src={conversations.find((c) => c.id === selectedConversation)?.avatar || ''}
                          alt={conversations.find((c) => c.id === selectedConversation)?.name || ''}
                        />
                        {conversations.find((c) => c.id === selectedConversation)?.isOnline && (
                          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {conversations.find((c) => c.id === selectedConversation)?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isTyping ? (
                            <span className="flex items-center text-green-600 font-semibold">
                              <span>Typing</span>
                              <span className="ml-1 flex">
                                <span className="animate-bounce mx-0.5" style={{animationDelay: "0ms"}}>.</span>
                                <span className="animate-bounce mx-0.5" style={{animationDelay: "300ms"}}>.</span>
                                <span className="animate-bounce mx-0.5" style={{animationDelay: "600ms"}}>.</span>
                              </span>
                            </span>
                          ) : (
                            conversations.find((c) => c.id === selectedConversation)?.isOnline 
                            ? 'Online' 
                            : 'Offline'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages List */}
                  <div 
                    className="flex-1 overflow-y-auto p-4 bg-gray-50"
                    onScroll={handleMessagesScroll}
                  >
                    {loadingMessages ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : filteredMessages.length > 0 ? (
                      <div className="space-y-4">
                        {filteredMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {message.senderId !== currentUser?.id && message.sender && (
                              <div className="flex-shrink-0 mr-2">
                                <img
                                  className="h-8 w-8 rounded-full object-cover"
                                  src={message.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name)}`}
                                  alt={message.sender.name}
                                />
                              </div>
                            )}
                            <div
                              className={`max-w-xs px-4 py-2 rounded-lg ${
                                message.senderId === currentUser?.id
                                  ? 'bg-blue-600 text-white rounded-br-none'
                                  : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 flex items-center ${
                                  message.senderId === currentUser?.id
                                    ? 'text-blue-100'
                                    : 'text-gray-500'
                                }`}
                              >
                                {formatTime(message.createdAt)}
                                {message.pending && (
                                  <span className="ml-2">
                                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </span>
                                )}
                                {message.error && (
                                  <span className="ml-2 text-red-300">
                                    !
                                  </span>
                                )}
                                {message.delivered && message.senderId === currentUser?.id && !message.read && (
                                  <span className="ml-2">✓</span>
                                )}
                                {message.read && message.senderId === currentUser?.id && (
                                  <span className="ml-2">✓✓</span>
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No messages yet</p>
                        <p className="text-sm mt-1">Start the conversation by sending a message</p>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <form onSubmit={handleSendMessage}>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          className="flex-1 rounded-full border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={handleTyping}
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Send
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No conversation selected</h3>
                    <p className="mt-1 text-sm text-gray-500">Select a conversation or search for a user to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 