import React, { useState, useEffect, useRef } from 'react';
import { useMessaging } from '@/contexts/MessagingContext';

interface ConversationProps {
  userId: string;
  userName: string;
  userAvatar?: string;
}

const Conversation: React.FC<ConversationProps> = ({ userId, userName, userAvatar }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    messages, 
    sendMessage, 
    typingUsers, 
    notifyTyping, 
    loadingMessages 
  } = useMessaging();
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    sendMessage(inputMessage, userId);
    setInputMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get current user ID from localStorage
  const getCurrentUserId = (): string => {
    try {
      const userJson = localStorage.getItem('user');
      if (!userJson) return '';
      
      const userData = JSON.parse(userJson);
      return userData.id;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return '';
    }
  };
  
  const currentUserId = getCurrentUserId();

  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="flex items-center p-4 border-b bg-white shadow-sm">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            userName.substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="ml-3">
          <h3 className="font-medium text-gray-900">{userName}</h3>
          {typingUsers[userId] && (
            <p className="text-xs text-gray-500">Typing...</p>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {loadingMessages ? (
          <div className="flex justify-center">
            <div className="loader">Loading...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center p-6 text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    message.senderId === currentUserId
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border text-gray-900'
                  }`}
                >
                  <div className="break-words">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.senderId === currentUserId
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {formatTimestamp(message.createdAt)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t">
        <div className="flex items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              notifyTyping(userId);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="ml-2 bg-blue-500 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Conversation;
