'use client';

import { useState, useEffect } from 'react';

// Define the API endpoint URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface DashboardStats {
  users: number;
  posts: number;
  messages: number;
  earlyBirdSignups: number;
  pendingEarlyBirdSignups: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/api/admin/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }

        const data = await response.json();
        setStats(data.stats);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Error loading dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-gray-900">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-gray-900">Dashboard Overview</h1>
      
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <StatCard 
            title="Total Users" 
            value={stats.users} 
            icon="👤"
            color="bg-blue-100" 
          />
          <StatCard 
            title="Total Posts" 
            value={stats.posts} 
            icon="📝"
            color="bg-green-100" 
          />
          <StatCard 
            title="Total Messages" 
            value={stats.messages} 
            icon="✉️"
            color="bg-purple-100" 
          />
          <StatCard 
            title="Early Bird Signups" 
            value={stats.earlyBirdSignups} 
            icon="🦅"
            color="bg-yellow-100" 
          />
          <StatCard 
            title="Pending Approvals" 
            value={stats.pendingEarlyBirdSignups} 
            icon="⏳"
            color="bg-orange-100" 
            highlight={stats.pendingEarlyBirdSignups > 0}
          />
        </div>
      )}

      <div className="mt-8 md:mt-10">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionButton 
            title="Manage Users" 
            href="/admin/users" 
            description="View and manage user accounts"
          />
          <ActionButton 
            title="Manage Posts" 
            href="/admin/posts" 
            description="Review and moderate posts"
          />
          <ActionButton 
            title="Early Bird Signups" 
            href="/admin/early-bird" 
            description="Approve early access registrations"
            highlight={stats?.pendingEarlyBirdSignups ? stats.pendingEarlyBirdSignups > 0 : false}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color,
  highlight = false 
}: { 
  title: string; 
  value: number; 
  icon: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={`${color} rounded-lg shadow p-4 md:p-6 ${highlight ? 'ring-2 ring-red-500' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-900 text-sm font-semibold">{title}</p>
          <p className="text-2xl md:text-3xl font-bold mt-1 text-gray-900">{value}</p>
        </div>
        <div className="text-3xl md:text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function ActionButton({ 
  title, 
  href, 
  description,
  highlight = false 
}: { 
  title: string; 
  href: string; 
  description: string;
  highlight?: boolean;
}) {
  return (
    <a 
      href={href} 
      className={`block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow ${highlight ? 'ring-2 ring-red-500' : ''}`}
    >
      <h3 className="font-bold text-lg text-gray-900">{title}</h3>
      <p className="text-gray-800 text-sm mt-1">{description}</p>
    </a>
  );
} 