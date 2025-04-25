import React, { useEffect, useState } from 'react';
import { useMessaging } from '@/contexts/MessagingContext';

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const ConversationList: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveConversation, activeConversation, onlineUsers } = useMessaging();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_URL}/api/conversations`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border-r h-full">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 border-r h-full bg-white overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 p-2">Messages</h2>
      
      {conversations.length === 0 ? (
        <div className="text-center p-4 text-gray-500">
          No conversations yet
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                activeConversation === conversation.id
                  ? 'bg-blue-100'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setActiveConversation(conversation.id)}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                  {conversation.avatar ? (
                    <img
                      src={conversation.avatar}
                      alt={conversation.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    conversation.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                {onlineUsers.has(conversation.id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <div className="ml-3 flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 truncate">
                    {conversation.name}
                  </span>
                  {conversation.unreadCount ? (
                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
                
                {conversation.lastMessage && (
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.lastMessage}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationList;
