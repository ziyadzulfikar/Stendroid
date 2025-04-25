'use client';

import { useState, useEffect } from 'react';

// Define the API endpoint URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  userType: string;
  _count: {
    posts: number;
    sentMessages: number;
    receivedMessages: number;
  };
  banned?: boolean;
  isAdmin?: boolean;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [banReason, setBanReason] = useState<string>('');
  const [userToBan, setUserToBan] = useState<User | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isUnbanning, setIsUnbanning] = useState<boolean>(false);
  const [isTogglingAdmin, setIsTogglingAdmin] = useState<boolean>(false);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/users?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error loading users');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get the current user ID from localStorage
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        setCurrentUserId(userData.id);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    fetchUsers(1);
  }, []);

  const handleBanClick = (user: User) => {
    setUserToBan(user);
    setBanReason('');
    setShowModal(true);
  };

  const handleBanUser = async () => {
    if (!userToBan) return;

    try {
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user');
      
      // Only perform self-ban check if we have valid user data
      if (userString && userToBan) {
        try {
          const userData = JSON.parse(userString);
          
          console.log('Current admin ID:', userData.id);
          console.log('User to ban ID:', userToBan.id);
          
          // Make sure we're comparing strings
          const currentUserId = String(userData.id);
          const userToBanId = String(userToBan.id);
          
          // Prevent self-banning (additional safety check)
          if (currentUserId === userToBanId) {
            alert('You cannot ban yourself');
            setShowModal(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      const response = await fetch(`${API_URL}/api/admin/users/${userToBan.id}/ban`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: banReason })
      });

      if (!response.ok) {
        throw new Error('Failed to ban user');
      }

      // Close modal and refresh the list
      setShowModal(false);
      fetchUsers(pagination.page);
      
      alert(`User ${userToBan.name} has been banned.`);
    } catch (err) {
      console.error('Error banning user:', err);
      alert('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string, userName: string) => {
    try {
      setIsUnbanning(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/unban`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to unban user');
      }

      // Refresh the list
      fetchUsers(pagination.page);
      
      alert(`User ${userName} has been unbanned.`);
    } catch (err) {
      console.error('Error unbanning user:', err);
      alert('Failed to unban user');
    } finally {
      setIsUnbanning(false);
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean, userName: string) => {
    try {
      // Don't allow removing admin status from yourself
      const userString = localStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        if (userData.id === userId && currentStatus) {
          alert('You cannot remove your own admin privileges');
          return;
        }
      }

      setIsTogglingAdmin(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/toggle-admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAdmin: !currentStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update user admin status');
      }

      // Refresh the list
      fetchUsers(pagination.page);
      
      alert(`User ${userName}'s admin status has been ${!currentStatus ? 'granted' : 'removed'}.`);
    } catch (err) {
      console.error('Error toggling admin status:', err);
      alert('Failed to update admin status');
    } finally {
      setIsTogglingAdmin(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading && users.length === 0) {
    return <div className="text-center py-10">Loading users...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  // Filter users by category
  const adminUsers = users.filter(user => user.isAdmin && !user.banned);
  const bannedAdminUsers = users.filter(user => user.isAdmin && user.banned);
  const bannedRegularUsers = users.filter(user => !user.isAdmin && user.banned);
  const regularUsers = users.filter(user => !user.isAdmin && !user.banned);

  const renderUserTable = (userList: User[], title: string, titleClass: string) => (
    <div className="mb-8">
      <h2 className={`text-xl font-semibold mb-4 ${titleClass}`}>{title} ({userList.length})</h2>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                User Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Joined Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {userList.length > 0 ? userList.map((user) => (
              <tr key={user.id} className={user.banned ? 'bg-red-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-800">
                    Posts: {user._count.posts} | 
                    Messages: {user._count.sentMessages + user._count.receivedMessages}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.userType === 'startup' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                    {user.userType ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1) : 'Startup'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center space-x-2">
                    {user.banned ? (
                      <div className="flex items-center space-x-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Banned
                        </span>
                        <button
                          onClick={() => handleUnbanUser(user.id, user.name)}
                          disabled={isUnbanning}
                          className="text-green-600 hover:text-green-900 text-sm font-medium"
                        >
                          Unban
                        </button>
                      </div>
                    ) : user.id === currentUserId ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Current User
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBanClick(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Ban
                      </button>
                    )}
                    
                    {/* Admin Toggle Button */}
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => handleToggleAdmin(user.id, !!user.isAdmin, user.name)}
                        disabled={isTogglingAdmin}
                        className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isAdmin 
                            ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No users found in this category
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">User Management</h1>
      
      {renderUserTable(adminUsers, 'Admin Users', 'text-blue-600')}
      {renderUserTable(bannedAdminUsers, 'Banned Admin Users', 'text-purple-600')}
      {renderUserTable(bannedRegularUsers, 'Banned Regular Users', 'text-red-600')}
      {renderUserTable(regularUsers, 'Regular Users', 'text-green-600')}
      
      <div className="flex justify-between p-4 bg-white shadow rounded-lg mt-4">
        <div>
          <span className="text-sm text-gray-700">
            Showing <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{Math.ceil(pagination.total / pagination.limit)}</span> pages
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchUsers(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => fetchUsers(pagination.page + 1)}
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Ban User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Ban User</h2>
            <p className="mb-4 text-gray-900">
              Are you sure you want to ban {userToBan?.name}?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Reason for ban:
              </label>
              <textarea
                className="w-full border rounded p-2 text-gray-900"
                rows={3}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter reason for banning this user"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 