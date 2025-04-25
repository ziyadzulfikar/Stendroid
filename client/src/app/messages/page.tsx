'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
}

interface Messages {
  [key: string]: Message[];
}

// Mock data for conversations
const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'John Doe',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    lastMessage: 'Hey, thanks for connecting! I saw your profile and we have similar interests in React development.',
    timestamp: '2023-04-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    lastMessage: 'I read your article on React performance optimization. It was really helpful!',
    timestamp: '2023-04-14T15:30:00Z',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    lastMessage: 'Are you available for a quick chat about the project we discussed?',
    timestamp: '2023-04-13T09:15:00Z',
  },
];

// Mock data for messages
const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '1',
      content: 'Hey, thanks for connecting! I saw your profile and we have similar interests in React development.',
      senderId: '1',
      timestamp: new Date('2024-03-10T10:00:00').toISOString(),
    },
    {
      id: '2',
      content: 'Hi John! Thanks for reaching out. Yes, I\'m always interested in connecting with other React developers.',
      senderId: 'current-user',
      timestamp: '2023-04-15T10:05:00Z',
    },
    {
      id: '3',
      content: 'Great! Have you worked with Next.js before? I\'m thinking of using it for my next project.',
      senderId: '1',
      timestamp: '2023-04-15T10:10:00Z',
    },
  ],
  '2': [
    {
      id: '1',
      content: 'I read your article on React performance optimization. It was really helpful!',
      senderId: '2',
      timestamp: '2023-04-14T15:30:00Z',
    },
    {
      id: '2',
      content: 'Thank you! I\'m glad you found it useful. Are you working on any performance issues in your current project?',
      senderId: 'current-user',
      timestamp: '2023-04-14T16:00:00Z',
    },
  ],
  '3': [
    {
      id: '1',
      content: 'Are you available for a quick chat about the project we discussed?',
      senderId: '3',
      timestamp: '2023-04-13T09:15:00Z',
    },
  ],
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Messages>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: 'current-user',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => ({
      ...prev,
      [selectedConversation]: [...(prev[selectedConversation] || []), newMsg],
    }));

    // Update the last message in the conversation
    setConversations((prev) => 
      prev.map((conv) => 
        conv.id === selectedConversation 
          ? { ...conv, lastMessage: newMessage, timestamp: new Date().toISOString() } 
          : conv
      )
    );

    setNewMessage('');
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
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="flex h-[calc(100vh-12rem)]">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 bg-blue-50">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                      selectedConversation === conversation.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 relative">
                        <img
                          className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                          src={conversation.avatar}
                          alt={conversation.name}
                        />
                        {conversation.lastMessage && (
                          <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-blue-600 ring-2 ring-white"></span>
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isToday(conversation.timestamp) 
                              ? formatTime(conversation.timestamp) 
                              : formatDate(conversation.timestamp)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="w-2/3 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                          src={conversations.find((c) => c.id === selectedConversation)?.avatar || ''}
                          alt={conversations.find((c) => c.id === selectedConversation)?.name || ''}
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {conversations.find((c) => c.id === selectedConversation)?.name}
                        </p>
                        <p className="text-xs text-gray-500">Active now</p>
                      </div>
                      <div className="ml-auto flex space-x-2">
                        <button className="p-2 rounded-full hover:bg-gray-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </button>
                        <button className="p-2 rounded-full hover:bg-gray-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button className="p-2 rounded-full hover:bg-gray-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="space-y-4">
                      {messages[selectedConversation]?.map((message: Message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderId === 'current-user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.senderId !== 'current-user' && (
                            <div className="flex-shrink-0 mr-2">
                              <img
                                className="h-8 w-8 rounded-full object-cover"
                                src={conversations.find((c) => c.id === selectedConversation)?.avatar || ''}
                                alt={conversations.find((c) => c.id === selectedConversation)?.name || ''}
                              />
                            </div>
                          )}
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              message.senderId === 'current-user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.senderId === 'current-user'
                                  ? 'text-blue-100'
                                  : 'text-gray-500'
                              }`}
                            >
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <form onSubmit={handleSendMessage}>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </button>
                        <input
                          type="text"
                          className="flex-1 rounded-full border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                    <p className="mt-1 text-sm text-gray-500">Select a conversation to start messaging</p>
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