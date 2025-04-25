'use client';

import { useState } from 'react';

// Define the API endpoint URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function EarlyBirdSignupForm() {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'startup' | 'enterprise'>('startup');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    try {
      setStatus('loading');

      const response = await fetch(`${API_URL}/api/early-bird/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, userType })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error signing up for early access:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="glass p-8 rounded-2xl shadow-2xl max-w-md mx-auto mt-8 border border-blue-200/60 bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      <h2 className="text-3xl font-extrabold mb-4 text-center text-blue-900">Get Early Access</h2>
      <p className="text-gray-900 mb-6 text-center text-lg">
        Sign up now to be among the first to experience our platform when we launch.
      </p>
      
      {status === 'success' ? (
        <div className="bg-gradient-to-r from-cyan-100 to-blue-100 border border-cyan-300 text-gray-900 px-4 py-3 rounded-xl shadow mb-4 animate-fade-in">
          <span className="block sm:inline">{message}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-base font-semibold text-gray-900 mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-5 py-3 border border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white/70 shadow-sm text-lg text-gray-900 placeholder:text-gray-500 transition-all duration-150"
              required
            />
          </div>
          <div>
            <p className="block text-base font-semibold text-gray-900 mb-2">Organization Type</p>
            <div className="flex gap-6">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="startup"
                  name="userType"
                  value="startup"
                  checked={userType === 'startup'}
                  onChange={() => setUserType('startup')}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="startup" className="ml-2 block text-gray-900 text-lg">
                  Startup
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="enterprise"
                  name="userType"
                  value="enterprise"
                  checked={userType === 'enterprise'}
                  onChange={() => setUserType('enterprise')}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="enterprise" className="ml-2 block text-gray-900 text-lg">
                  Enterprise
                </label>
              </div>
            </div>
          </div>
          {status === 'error' && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-900 px-4 py-3 rounded-xl shadow animate-fade-in">
              <span className="block sm:inline">{message}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full btn-gradient text-lg font-bold py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 disabled:opacity-50"
          >
            {status === 'loading' ? 'Submitting...' : 'Request Early Access'}
          </button>
        </form>
      )}
    </div>
  );
} 