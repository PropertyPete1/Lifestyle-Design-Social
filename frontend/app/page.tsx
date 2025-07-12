'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/components/Dashboard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    setDebugInfo(`
      isLoading: ${isLoading}
      isAuthenticated: ${isAuthenticated}
      user: ${user ? JSON.stringify(user, null, 2) : 'null'}
      token: ${token ? 'exists' : 'none'}
      storedUser: ${storedUser ? 'exists' : 'none'}
    `);

    if (!isLoading && !isAuthenticated) {
      console.log('Redirecting to login...');
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
          <pre className="mt-4 text-xs text-left bg-gray-100 p-4 rounded">
            {debugInfo}
          </pre>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Not authenticated. Redirecting to login...</p>
          <pre className="mt-4 text-xs text-left bg-gray-100 p-4 rounded">
            {debugInfo}
          </pre>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
