'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

// Mock data for posts
const mockPosts = [
  {
    id: '1',
    content: 'Excited to announce that I\'ve joined a new company as a Senior Developer! Looking forward to new challenges and opportunities.',
    author: {
      id: '1',
      name: 'John Doe',
      headline: 'Senior Software Engineer',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    createdAt: '2023-04-15T10:00:00Z',
    likes: 42,
    comments: 5,
  },
  {
    id: '2',
    content: 'Just published my latest article on React performance optimization. Check it out if you\'re interested in improving your app\'s speed!',
    author: {
      id: '2',
      name: 'Jane Smith',
      headline: 'Frontend Developer | Technical Writer',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    },
    createdAt: '2023-04-14T15:30:00Z',
    likes: 28,
    comments: 3,
  },
  {
    id: '3',
    content: 'Looking for recommendations for a good project management tool. What do you use and why do you like it?',
    author: {
      id: '3',
      name: 'Mike Johnson',
      headline: 'Product Manager',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
    createdAt: '2023-04-13T09:15:00Z',
    likes: 15,
    comments: 12,
  },
];

// Define the API endpoint URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState(mockPosts);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated and not banned
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      
      if (!token || !userJson) {
        router.push('/auth/login');
        return;
      }
      
      try {
        // Get the current user's ID
        const userData = JSON.parse(userJson);
        const currentUserId = userData.id;
        
        // Check if this specific user is banned
        const response = await fetch(`${API_URL}/api/auth/check-ban/${currentUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        // Only logout if THIS user is banned
        if (data.banned) {
          // Clear authentication
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Redirect with message
          alert(`Your account has been banned. Reason: ${data.banReason || 'Violation of terms of service'}`);
          router.push('/auth/login');
          return;
        }
        
        // User is authenticated and not banned
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking ban status:', error);
        // Don't automatically log out on error - just show the feed
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, [router]);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const post = {
      id: Date.now().toString(),
      content: newPost,
      author: {
        id: 'current-user',
        name: 'Current User',
        headline: 'Software Developer',
        avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
      },
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
    };

    setPosts([post, ...posts]);
    setNewPost('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Create Post */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <form onSubmit={handlePostSubmit}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <img
                  className="h-10 w-10 rounded-full"
                  src="https://randomuser.me/api/portraits/men/4.jpg"
                  alt="Your profile"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="border border-gray-300 rounded-lg shadow-sm overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  <label htmlFor="post" className="sr-only">
                    Create a post
                  </label>
                  <textarea
                    rows={3}
                    name="post"
                    id="post"
                    className="block w-full py-3 px-4 border-0 resize-none focus:ring-0 sm:text-sm"
                    placeholder="What do you want to talk about?"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                  />
                  <div className="flex items-center justify-between px-4 py-2 border-t border-gray-300 bg-gray-50">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Photo
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Video
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={post.author.avatar}
                      alt={post.author.name}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">{post.author.name}</div>
                    <div className="text-sm text-gray-500">{post.author.headline}</div>
                    <div className="mt-2 text-sm text-gray-700">{post.content}</div>
                    <div className="mt-2 text-xs text-gray-500">{formatDate(post.createdAt)}</div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                <div className="flex space-x-4">
                  <button className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <svg
                      className="h-5 w-5 mr-1"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                      />
                    </svg>
                    Like ({post.likes})
                  </button>
                  <button className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <svg
                      className="h-5 w-5 mr-1"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Comment ({post.comments})
                  </button>
                  <button className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <svg
                      className="h-5 w-5 mr-1"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
} 