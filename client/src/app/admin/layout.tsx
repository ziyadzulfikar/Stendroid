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
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-md p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-900">Admin Dashboard</h1>
        <button
          onClick={toggleSidebar}
          className="text-gray-600 focus:outline-none focus:text-blue-500"
          aria-label="Toggle menu"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar - hidden on mobile unless toggled */}
      <div className={`
        ${sidebarOpen ? 'block' : 'hidden'} md:block
        fixed md:static top-14 left-0 right-0 z-10
        md:w-64 bg-white shadow-md
        h-screen md:h-auto overflow-y-auto
      `}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold text-blue-900">Admin Dashboard</h1>
        </div>
        <nav className="mt-6">
          <ul>
            <li>
              <Link href="/admin" 
                className="block px-6 py-3 text-gray-900 hover:bg-blue-50"
                onClick={() => setSidebarOpen(false)}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/users" 
                className="block px-6 py-3 text-gray-900 hover:bg-blue-50"
                onClick={() => setSidebarOpen(false)}
              >
                Users
              </Link>
            </li>
            <li>
              <Link href="/admin/posts" 
                className="block px-6 py-3 text-gray-900 hover:bg-blue-50"
                onClick={() => setSidebarOpen(false)}
              >
                Posts
              </Link>
            </li>
            <li>
              <Link href="/admin/early-bird" 
                className="block px-6 py-3 text-gray-900 hover:bg-blue-50"
                onClick={() => setSidebarOpen(false)}
              >
                Early Bird Signups
              </Link>
            </li>
            <li className="mt-6 border-t pt-3">
              <Link href="/feed" 
                className="block px-6 py-3 text-gray-900 hover:bg-blue-50"
                onClick={() => setSidebarOpen(false)}
              >
                Back to Site
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content - adjust padding on mobile */}
      <div className="flex-1 p-4 md:p-8 pt-4">
        {children}
      </div>
    </div>
  );
} 