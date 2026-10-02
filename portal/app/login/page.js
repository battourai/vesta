'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true); // Toggle between Login and Register

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [publisherName, setPublisherName] = useState(''); // Only used for registration
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    const payload = isLoginMode 
      ? { email, password } 
      : { email, password, publisherName };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isLoginMode) {
        // Successfully logged in, redirect to home or dashboard
        router.push('/dashboard');
        router.refresh();
      } else {
        // Successfully registered, switch to login mode and prompt user
        alert('Account created successfully! Please log in with your new credentials.');
        setIsLoginMode(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center text-2xl font-black tracking-tight text-neutral-900 mb-2">
          Vesta<span className="text-blue-600">.ph</span>
        </Link>
        <h2 className="text-center text-xl font-bold tracking-tight text-neutral-900">
          {isLoginMode ? 'Sign in to your publisher account' : 'Create your Vesta publisher profile'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-neutral-200 rounded-xl sm:px-10">
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!isLoginMode && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                  Agency / Publisher Name
                </label>
                <input
                  type="text"
                  required={!isLoginMode}
                  value={publisherName}
                  onChange={(e) => setPublisherName(e.target.value)}
                  placeholder="e.g. Prime Manila Realty"
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@vesta.ph"
                className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 px-4 rounded-md text-sm transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Create Publisher Account')}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 text-center text-xs text-neutral-600">
            {isLoginMode ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => { setIsLoginMode(false); setError(''); }}
                  className="font-semibold text-neutral-900 hover:underline ml-1"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsLoginMode(true); setError(''); }}
                  className="font-semibold text-neutral-900 hover:underline ml-1"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}