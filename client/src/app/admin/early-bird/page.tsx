'use client';

import { useState, useEffect } from 'react';

// Define the API endpoint URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface EarlyBirdSignup {
  id: string;
  email: string;
  userType: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function EarlyBirdSignupsPage() {
  const [signups, setSignups] = useState<EarlyBirdSignup[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('pending');
  const [approving, setApproving] = useState<boolean>(false);

  const fetchSignups = async (page = 1, status?: boolean) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      let url = `${API_URL}/api/admin/early-bird?page=${page}`;
      if (status !== undefined) {
        url += `&approved=${status}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch early bird signups');
      }

      const data = await response.json();
      setSignups(data.signups);
      setPagination(data.pagination);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching early bird signups:', err);
      setError('Error loading signups');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply filter when it changes
    if (filter === 'approved') {
      fetchSignups(1, true);
    } else if (filter === 'pending') {
      fetchSignups(1, false);
    } else {
      fetchSignups(1);
    }
  }, [filter]);

  const handleFilterChange = (newFilter: 'all' | 'approved' | 'pending') => {
    setFilter(newFilter);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(signups.filter(signup => !signup.approved).map(signup => signup.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectSignup = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(signupId => signupId !== id));
    }
  };

  const handleApproveSelected = async () => {
    if (selectedIds.length === 0) return;

    try {
      setApproving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/admin/early-bird/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (!response.ok) {
        throw new Error('Failed to approve signups');
      }

      const data = await response.json();
      
      // Refresh the list
      setSelectedIds([]);
      fetchSignups(pagination.page, filter === 'pending' ? false : filter === 'approved' ? true : undefined);
      
      alert(`Successfully approved ${data.updated} signups!`);
    } catch (err) {
      console.error('Error approving signups:', err);
      alert('Failed to approve signups');
    } finally {
      setApproving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading && signups.length === 0) {
    return <div className="text-center py-10">Loading early bird signups...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Early Bird Signups</h1>
        
        <div className="flex space-x-2">
          <button 
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}
            onClick={() => handleFilterChange('all')}
          >
            All
          </button>
          <button 
            className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}
            onClick={() => handleFilterChange('pending')}
          >
            Pending
          </button>
          <button 
            className={`px-4 py-2 rounded ${filter === 'approved' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}
            onClick={() => handleFilterChange('approved')}
          >
            Approved
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4 flex justify-between items-center">
          <p>{selectedIds.length} signups selected</p>
          <button 
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-300"
            onClick={handleApproveSelected}
            disabled={approving || selectedIds.length === 0}
          >
            {approving ? 'Approving...' : 'Approve Selected'}
          </button>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={selectedIds.length > 0 && selectedIds.length === signups.filter(s => !s.approved).length}
                  className="h-4 w-4"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                User Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Signup Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {signups.map((signup) => (
              <tr key={signup.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {!signup.approved && (
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(signup.id)}
                      onChange={(e) => handleSelectSignup(signup.id, e.target.checked)}
                      className="h-4 w-4"
                    />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {signup.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${signup.userType === 'enterprise' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {signup.userType === 'enterprise' ? 'Enterprise' : 'Startup'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {signup.approved ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Approved
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(signup.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {signups.length === 0 && (
          <div className="text-center py-8 text-gray-900">
            No early bird signups found.
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
            <button
              className="px-4 py-2 border rounded bg-white disabled:opacity-50"
              disabled={pagination.page === 1}
              onClick={() => fetchSignups(pagination.page - 1, filter === 'pending' ? false : filter === 'approved' ? true : undefined)}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              className="px-4 py-2 border rounded bg-white disabled:opacity-50"
              disabled={pagination.page === pagination.pages}
              onClick={() => fetchSignups(pagination.page + 1, filter === 'pending' ? false : filter === 'approved' ? true : undefined)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 