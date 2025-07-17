'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate, formatFileSize } from '@/lib/utils';

interface Cartoon {
  filename: string;
  size: number;
  created: string;
}

export default function CartoonsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [cartoons, setCartoons] = useState<Cartoon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchCartoons();
    }
  }, [user]);

  const fetchCartoons = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/autopost/cartoons');
      setCartoons(response.data.cartoons || []);
    } catch (error: unknown) {
      console.error('Failed to fetch cartoons:', error);
      setError('Failed to load cartoons. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSample = async () => {
    try {
      setError(null);
      await apiClient.post('/autopost/create-sample-cartoon');
      // Refresh the list
      fetchCartoons();
    } catch (error: unknown) {
      console.error('Failed to create sample cartoon:', error);
      setError('Failed to create sample cartoon. Please try again.');
    }
  };



  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Cartoon Gallery</h1>
                <p className="text-gray-600">AI-generated cartoon videos ready for posting</p>
              </div>
            </div>
            <button
              onClick={handleCreateSample}
              className="btn-primary"
            >
              Create Sample Cartoon
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {cartoons.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-4xl">🎨</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cartoons yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first cartoon to get started with auto-posting
            </p>
            <button
              onClick={handleCreateSample}
              className="btn-primary"
            >
              Create Your First Cartoon
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cartoons.map((cartoon) => (
              <div key={cartoon.filename} className="card overflow-hidden">
                <div className="aspect-video bg-gray-900 relative">
                  <video
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                    poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhcnRvb24gVmlkZW88L3RleHQ+Cjwvc3ZnPg=="
                  >
                    <source
                      src={`/api/autopost/cartoons/download/${cartoon.filename}`}
                      type="video/mp4"
                    />
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                      <span className="text-2xl text-gray-800">▶️</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">
                    {cartoon.filename.replace(/\.[^/.]+$/, "")}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium">{formatFileSize(cartoon.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span className="font-medium">{formatDate(cartoon.created)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `/api/autopost/cartoons/download/${cartoon.filename}`;
                        link.download = cartoon.filename;
                        link.click();
                      }}
                      className="btn-secondary flex-1 text-sm"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => {
                        // Future: Add to posting queue
                        alert("Post scheduling feature requires backend integration!");
                      }}
                      className="btn-primary flex-1 text-sm"
                    >
                      Schedule Post
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            🎨 About Cartoon Videos
          </h3>
          <p className="text-blue-800 mb-4">
            These AI-generated cartoon videos are automatically created from your uploaded content. 
            They are perfect for social media posting and can be scheduled for automatic publishing.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-blue-800">Optimized for social media</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-blue-800">Auto-generated captions</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-blue-800">Ready for auto-posting</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 