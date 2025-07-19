'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Welcome to your Dashboard 🎉</h1>
      <p>You're logged in as {user}.</p>
    </main>
  );
} 