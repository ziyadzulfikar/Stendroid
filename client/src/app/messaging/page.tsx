'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConversationList from '@/components/messaging/ConversationList';
import Conversation from '@/components/messaging/Conversation';
import { useMessaging } from '@/contexts/MessagingContext';

interface User {
  id: string;
  name: string;
  avatar?: string;
}

export default function MessagingPage() {
  const router = useRouter();
  const { activeConversation } = useMessaging();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  // Fetch user details for active conversation
  useEffect(() => {
    if (!activeConversation) return;

    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users/${activeConversation}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSelectedUser(data);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, [activeConversation]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-[calc(100vh-8rem)]">
      <div className="flex h-full">
        {/* Conversation List Sidebar */}
        <div className="w-1/3 border-r">
          <ConversationList />
        </div>

        {/* Active Conversation or Empty State */}
        <div className="w-2/3">
          {activeConversation && selectedUser ? (
            <Conversation 
              userId={selectedUser.id} 
              userName={selectedUser.name}
              userAvatar={selectedUser.avatar}
            />
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <h3 className="font-medium text-lg mb-2">Your Messages</h3>
              <p className="text-center max-w-sm px-4">
                Select a conversation from the list or start a new message to connect with your network
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
