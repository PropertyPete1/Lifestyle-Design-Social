import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Cartoon {
  fileName: string;
  filename?: string;
  size: number;
  created: string;
}

interface VideoBlobs {
  [fileName: string]: string;
}

const CartoonGallery: React.FC = () => {
  const [cartoons, setCartoons] = useState<Cartoon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCartoon, setSelectedCartoon] = useState<Cartoon | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [videoBlobs, setVideoBlobs] = useState<VideoBlobs>({});

  const fetchCartoons = useCallback(async (): Promise<void> => {
    try {
      const response = await axios.get('/api/autopost/cartoons');
      const cartoonsData = response.data.cartoons || [];
      
      // Normalize the cartoon data to ensure consistent property names
      const normalizedCartoons = cartoonsData.map((cartoon: any) => ({
        ...cartoon,
        fileName: cartoon.fileName || cartoon.filename || 'unknown-file.mp4'
      }));
      
      setCartoons(normalizedCartoons);
      
      // Pre-load video blobs for preview
      await loadVideoBlobs(normalizedCartoons);
    } catch (error) {
      console.error('Error fetching cartoons:', error);
      toast.error('Failed to load cartoons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCartoons();
  }, [fetchCartoons]);

  const loadVideoBlobs = async (cartoonsData: Cartoon[]): Promise<void> => {
    const blobs: VideoBlobs = {};
    
    for (const cartoon of cartoonsData) {
      try {
        const fileName = cartoon.fileName || cartoon.filename;
        if (!fileName) continue;
        
        const response = await axios.get(`/api/autopost/cartoons/download/${encodeURIComponent(fileName)}`, {
          responseType: 'blob'
        });
        
        const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'video/mp4' }));
        blobs[fileName] = blobUrl;
      } catch (error) {
        console.error(`Error loading video blob for ${cartoon.fileName || cartoon.filename}:`, error);
      }
    }
    
    setVideoBlobs(blobs);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const openModal = (cartoon: Cartoon): void => {
    setSelectedCartoon(cartoon);
    setShowModal(true);
  };

  const closeModal = (): void => {
    setSelectedCartoon(null);
    setShowModal(false);
  };

  const downloadCartoon = async (cartoon: Cartoon): Promise<void> => {
    try {
      const fileName = cartoon.fileName || cartoon.filename;
      if (!fileName) return;
      
      const response = await axios.get(`/api/autopost/cartoons/download/${encodeURIComponent(fileName)}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download cartoon');
    }
  };

  const createSampleCartoon = async (): Promise<void> => {
    try {
      setLoading(true);
      await axios.post('/api/autopost/create-sample-cartoon');
      toast.success('Sample cartoon created!');
      fetchCartoons();
    } catch (error) {
      console.error('Create sample error:', error);
      toast.error('Failed to create sample cartoon');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🎨 Cartoon Gallery</h1>
            <p className="text-gray-600 mt-1">AI-generated cartoon videos for social media</p>
          </div>
          <button
            onClick={createSampleCartoon}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Sample Cartoon
          </button>
        </div>

        {cartoons.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No cartoons yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first cartoon to get started with auto-posting
            </p>
            <button
              onClick={createSampleCartoon}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Cartoon
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cartoons.map((cartoon, index) => {
              const fileName = cartoon.fileName || cartoon.filename || `cartoon-${index}`;
              const blobUrl = videoBlobs[fileName];
              
              return (
                <div key={fileName} className="bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  {/* Video Preview */}
                  <div className="relative h-48 bg-gray-200">
                    {blobUrl ? (
                      <video
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openModal(cartoon)}
                        muted
                        loop
                        onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                        onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                      >
                        <source src={blobUrl} type="video/mp4" />
                      </video>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-gray-400">
                          <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          <p className="text-sm">Loading...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                         onClick={() => openModal(cartoon)}>
                      <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Cartoon Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 truncate">
                      {fileName.replace(/\.[^/.]+$/, "").replace(/-/g, " ")}
                    </h3>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <div>Size: {formatFileSize(cartoon.size)}</div>
                      <div>Created: {formatDate(cartoon.created)}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => downloadCartoon(cartoon)}
                        className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => openModal(cartoon)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && selectedCartoon && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">
                    {(selectedCartoon.fileName || selectedCartoon.filename || 'Cartoon').replace(/\.[^/.]+$/, "").replace(/-/g, " ")}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {videoBlobs[selectedCartoon.fileName || selectedCartoon.filename || ''] && (
                    <video
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      loop
                    >
                      <source src={videoBlobs[selectedCartoon.fileName || selectedCartoon.filename || '']} type="video/mp4" />
                    </video>
                  )}
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <div>Size: {formatFileSize(selectedCartoon.size)}</div>
                    <div>Created: {formatDate(selectedCartoon.created)}</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadCartoon(selectedCartoon)}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={closeModal}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartoonGallery; 