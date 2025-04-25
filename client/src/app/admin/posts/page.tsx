'use client';

import { useState, useEffect } from 'react';

// Define the API endpoint URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface Author {
  id: string;
  name: string;
  email: string;
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  const fetchPosts = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/posts?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data.posts);
      setPagination(data.pagination);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Error loading posts');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post);
    setShowModal(true);
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/admin/posts/${postToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      // Close modal and refresh the list
      setShowModal(false);
      fetchPosts(pagination.page);
      
      alert('Post deleted successfully');
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Truncate content if it's too long
  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  if (loading && posts.length === 0) {
    return <div className="text-center py-10">Loading posts...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Post Management</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Author
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Posted Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.map((post) => (
              <tr key={post.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">{post.author.name}</div>
                    <div className="text-gray-800 text-sm">{post.author.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{truncateContent(post.content)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(post.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    onClick={() => handleDeleteClick(post)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {posts.length === 0 && (
          <div className="text-center py-8 text-gray-900">
            No posts found.
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
            <button
              className="px-4 py-2 border rounded bg-white disabled:opacity-50"
              disabled={pagination.page === 1}
              onClick={() => fetchPosts(pagination.page - 1)}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              className="px-4 py-2 border rounded bg-white disabled:opacity-50"
              disabled={pagination.page === pagination.pages}
              onClick={() => fetchPosts(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Delete Post Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Delete Post</h2>
            <p className="mb-4">
              Are you sure you want to delete this post by {postToDelete?.author.name}?
            </p>
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <p>{postToDelete?.content}</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 