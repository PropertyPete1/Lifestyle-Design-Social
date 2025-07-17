'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !loading) {
      if (isAuthenticated && user) {
        router.replace('/dashboard');
      }
    }
  }, [isClient, isAuthenticated, loading, user, router]);

  if (!isClient || loading) {
    return (
      <div className="page-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="page-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Layout title="Welcome">
      <div className="page-container animate-fade-in">
        {/* Lifestyle Header with Yellow Lines */}
        <div className="lifestyle-header">
          Lifestyle
        </div>
        
        {/* Main Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-white mb-4 tracking-wide">
            Auto-Posting App
          </h1>
          <p className="text-lg text-gray-400 font-light max-w-md mx-auto leading-relaxed">
            Automate your real estate social media with AI-powered content creation
          </p>
        </div>

        {/* Button Stack - Matching Reference Photo */}
        <div className="button-stack animate-fade-in">
          <button
            onClick={() => router.push('/register')}
            className="btn-primary animate-glow"
          >
            Get Started
          </button>
          <button
            onClick={() => router.push('/login')}
            className="btn-secondary"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-secondary"
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push('/videos')}
            className="btn-secondary"
          >
            Videos
          </button>
          <button
            onClick={() => router.push('/analytics')}
            className="btn-secondary"
          >
            Analytics
          </button>
        </div>

        {/* Footer Branding */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-sm font-light tracking-wider">
            LIFESTYLE DESIGN REALTY
          </p>
        </div>
      </div>
    </Layout>
  );
} 