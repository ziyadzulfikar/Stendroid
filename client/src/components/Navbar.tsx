'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const Navbar = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="glass shadow-lg mt-4 mx-2 rounded-2xl border border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 text-2xl font-extrabold tracking-tight select-none">
                Stendroid
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/feed"
                className={`inline-flex items-center px-3 pt-1 border-b-2 text-base font-semibold transition-all duration-150 ${
                  isActive('/feed')
                    ? 'border-blue-500 text-blue-900 bg-blue-50 rounded-t-lg shadow-sm'
                    : 'border-transparent text-gray-800 hover:border-blue-300 hover:text-blue-900 hover:bg-blue-50 rounded-t-lg'
                }`}
              >
                Feed
              </Link>
              <Link
                href="/messages"
                className={`inline-flex items-center px-3 pt-1 border-b-2 text-base font-semibold transition-all duration-150 ${
                  isActive('/messages')
                    ? 'border-blue-500 text-blue-900 bg-blue-50 rounded-t-lg shadow-sm'
                    : 'border-transparent text-gray-800 hover:border-blue-300 hover:text-blue-900 hover:bg-blue-50 rounded-t-lg'
                }`}
              >
                Messages
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="ml-3 relative">
              <div>
                <button
                  type="button"
                  className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 border-2 border-blue-200 hover:scale-105 transition-transform duration-150 shadow"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-300 to-cyan-300 flex items-center justify-center shadow-md">
                    <span className="text-white font-bold">U</span>
                  </div>
                </button>
              </div>
              {isMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-52 rounded-xl shadow-2xl py-2 glass border border-blue-100/60 focus:outline-none animate-fade-in">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                  >
                    Your Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                  >
                    Settings
                  </Link>
                  <button
                    className="block w-full text-left px-4 py-2 text-base text-red-600 hover:bg-red-50 rounded-md transition-colors duration-150"
                    onClick={() => {
                      // Handle logout
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      window.location.href = '/auth/login';
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden animate-fade-in">
          <div className="pt-2 pb-3 space-y-2">
            <Link
              href="/feed"
              className={`block pl-4 pr-6 py-2 border-l-4 text-lg font-semibold transition-all duration-150 ${
                isActive('/feed')
                  ? 'bg-blue-50 border-blue-500 text-blue-900 rounded-l-xl shadow-sm'
                  : 'border-transparent text-gray-800 hover:border-blue-300 hover:text-blue-900 hover:bg-blue-50 rounded-l-xl'
              }`}
            >
              Feed
            </Link>
            <Link
              href="/messages"
              className={`block pl-4 pr-6 py-2 border-l-4 text-lg font-semibold transition-all duration-150 ${
                isActive('/messages')
                  ? 'bg-blue-50 border-blue-500 text-blue-900 rounded-l-xl shadow-sm'
                  : 'border-transparent text-gray-800 hover:border-blue-300 hover:text-blue-900 hover:bg-blue-50 rounded-l-xl'
              }`}
            >
              Messages
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-blue-100">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-300 to-cyan-300 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold">U</span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-lg font-semibold text-gray-900">User Name</div>
                <div className="text-sm font-medium text-gray-800">user@example.com</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/profile"
                className="block px-4 py-2 text-base text-gray-900 hover:bg-blue-50 hover:text-blue-900 rounded-md transition-colors duration-150"
              >
                Your Profile
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-base text-gray-900 hover:bg-blue-50 hover:text-blue-900 rounded-md transition-colors duration-150"
              >
                Settings
              </Link>
              <button
                className="block w-full text-left px-4 py-2 text-base text-red-600 hover:bg-red-50 rounded-md transition-colors duration-150"
                onClick={() => {
                  // Handle logout
                  console.log('Logout clicked');
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 