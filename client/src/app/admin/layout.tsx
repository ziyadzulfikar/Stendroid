'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null;

    if (!token || !user) {
      router.push('/auth/login');
      return;
    }

    // This is simplified - in a real app, you would check if the user has admin role
    // by validating the token with your backend
    setIsAdmin(user.isAdmin === true);
    setLoading(false);
    
    if (user.isAdmin !== true) {
      router.push('/feed');
    }
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-900">Admin Dashboard</h1>
        </div>
        <nav className="mt-6">
          <ul>
            <li>
              <Link href="/admin" className="block px-6 py-3 text-gray-900 hover:bg-blue-50">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className="block px-6 py-3 text-gray-900 hover:bg-blue-50">
                Users
              </Link>
            </li>
            <li>
              <Link href="/admin/posts" className="block px-6 py-3 text-gray-900 hover:bg-blue-50">
                Posts
              </Link>
            </li>
            <li>
              <Link href="/admin/early-bird" className="block px-6 py-3 text-gray-900 hover:bg-blue-50">
                Early Bird Signups
              </Link>
            </li>
            <li className="mt-6 border-t pt-3">
              <Link href="/feed" className="block px-6 py-3 text-gray-900 hover:bg-blue-50">
                Back to Site
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
} 