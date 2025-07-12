'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api-client';
import { toast } from 'react-hot-toast';

interface Cartoon {
  fileName: string;
  url: string;
}

export default function CartoonsPage() {
  const { user } = useAuth();
  const [cartoons, setCartoons] = useState<Cartoon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCartoon, setSelectedCartoon] = useState<Cartoon | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [videoBlobs, setVideoBlobs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      fetchCartoons();
    }
  }, [user]);

  const fetchCartoons = async () => {
    try {
      const response = await apiClient.get('/autopost/cartoons');
      const cartoonsData = response.data.cartoons || [];
      setCartoons(cartoonsData);
      
      // Pre-load video blobs for preview
      await loadVideoBlobs(cartoonsData);
    } catch (error) {
      console.error('Error fetching cartoons:', error);
      toast.error('Failed to load cartoons');
    } finally {
      setLoading(false);
    }
  };

  const loadVideoBlobs = async (cartoonsData: Cartoon[]) => {
    const blobs: Record<string, string> = {};
    
    for (const cartoon of cartoonsData) {
      try {
        const response = await apiClient.get(`/autopost/cartoons/download/${encodeURIComponent(cartoon.fileName)}`, {
          responseType: 'blob',
        });
        
        const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'video/mp4' }));
        blobs[cartoon.fileName] = blobUrl;
      } catch (error) {
        console.error(`Error loading video blob for ${cartoon.fileName}:`, error);
      }
    }
    
    setVideoBlobs(blobs);
  };

  const downloadCartoon = async (fileName: string) => {
    try {
      const response = await apiClient.get(`/autopost/cartoons/download/${encodeURIComponent(fileName)}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${fileName}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download cartoon');
    }
  };

  const viewCartoon = (cartoon: Cartoon) => {
    setSelectedCartoon(cartoon);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCartoon(null);
  };

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(videoBlobs).forEach(blobUrl => {
        window.URL.revokeObjectURL(blobUrl);
      });
    };
  }, [videoBlobs]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Please log in to view cartoons</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">🎨 Cartoon Gallery</h1>
            <p className="text-yellow-200">AI-generated cartoon videos for your content mix</p>
          </div>
        </div>

        {/* Cartoons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cartoons.map((cartoon, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300">
              {/* Cartoon Preview */}
              <div className="relative h-48 bg-gray-800 rounded-lg mb-4 overflow-hidden">
                {videoBlobs[cartoon.fileName] ? (
                  <video
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                    src={videoBlobs[cartoon.fileName]}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-300">Loading video...</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Cartoon
                  </span>
                </div>
              </div>

              {/* Cartoon Info */}
              <div className="space-y-3">
                <h3 className="text-white font-semibold text-lg truncate">
                  {cartoon.fileName.replace('.mp4', '').replace(/[-_]/g, ' ')}
                </h3>
                
                <div className="text-yellow-200 text-sm">
                  <p>AI-generated cartoon video</p>
                  <p>Perfect for content variety</p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadCartoon(cartoon.fileName)}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    📥 Download
                  </button>
                  <button
                    onClick={() => viewCartoon(cartoon)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                    disabled={!videoBlobs[cartoon.fileName]}
                  >
                    👁️ View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {cartoons.length === 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-12 text-center">
            <div className="text-yellow-200 mb-4">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-white mb-2">No cartoons available</h3>
              <p className="text-yellow-200">
                Cartoon videos will be automatically generated when you upload real estate videos
              </p>
            </div>
          </div>
        )}

        {/* Video Modal */}
        {showModal && selectedCartoon && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-white">
                  {selectedCartoon.fileName.replace('.mp4', '').replace(/[-_]/g, ' ')}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                {videoBlobs[selectedCartoon.fileName] ? (
                  <video
                    className="w-full h-auto max-h-[70vh] rounded-lg"
                    controls
                    autoPlay
                    src={videoBlobs[selectedCartoon.fileName]}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-full h-96 flex items-center justify-center bg-gray-700 rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                      <p className="text-gray-300">Loading video...</p>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => downloadCartoon(selectedCartoon.fileName)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    📥 Download
                  </button>
                  <button
                    onClick={closeModal}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">About Cartoon Videos</h3>
          <div className="space-y-3 text-yellow-200">
            <p>
              🤖 <strong>AI-Generated:</strong> These cartoon videos are automatically created using advanced AI technology.
            </p>
            <p>
              🔄 <strong>Content Mix:</strong> Cartoons are automatically added to your content library every other video upload.
            </p>
            <p>
              📈 <strong>Engagement:</strong> Cartoon content helps diversify your feed and can boost overall engagement.
            </p>
            <p>
              ⚡ <strong>Ready to Use:</strong> Download and use these videos directly in your social media posts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 