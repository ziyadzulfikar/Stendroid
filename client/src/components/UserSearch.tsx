'use client';

import { useState, useEffect, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface UserSearchProps {
  onSelectUser: (user: User) => void;
  placeholder?: string;
}

export default function UserSearch({ onSelectUser, placeholder = "Search users..." }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Search users function
  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowResults(false);
      setError(null);
      return;
    }
    
    try {
      setIsSearching(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to search users');
        setIsSearching(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
      setIsSearching(false);
    } catch (error) {
      console.error('Error searching users:', error);
      setError(error instanceof Error ? error.message : 'Failed to search users');
      setIsSearching(false);
    }
  };
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchUsers();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    setSearchTerm('');
    setShowResults(false);
    setError(null);
  };
  
  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    setError(null);
    inputRef.current?.focus();
  };
  
  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm && setShowResults(true)}
        />
        {searchTerm && (
          <button 
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Search Results Dropdown */}
      {showResults && (
        <div 
          ref={searchResultsRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden"
        >
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-blue-500 mr-2"></div>
              Searching...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              {error}
            </div>
          ) : searchResults.length > 0 ? (
            <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <li 
                  key={user.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer flex items-center"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex-shrink-0">
                    <img
                      className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                      alt={user.name}
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    {user.email && (
                      <p className="text-xs text-gray-500">{user.email}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : searchTerm ? (
            <div className="p-4 text-center text-gray-500">
              No users found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 