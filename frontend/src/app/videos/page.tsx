'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { apiClient } from '@/lib/api-client'

interface Video {
  id: number;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  duration?: number;
  postCount: number;
  lastPosted?: string;
  category: string;
  status: string;
}

const VideosContent: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [editingCaptions, setEditingCaptions] = useState<{[key: number]: string}>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingCaptions, setGeneratingCaptions] = useState<{[key: number]: boolean}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize editing captions when videos load
  useEffect(() => {
    if (videos.length > 0) {
      const captions: {[key: number]: string} = {};
      videos.forEach(video => {
        captions[video.id] = video.description || '';
      });
      setEditingCaptions(captions);
    }
  }, [videos]);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async (): Promise<void> => {
    try {
      const response = await apiClient.get('/videos');
      setVideos(response.data.videos || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files: FileList): Promise<void> => {
    setUploading(true);
    
    for (const file of Array.from(files)) {
      if (file.type.startsWith('video/')) {
        await uploadVideo(file);
      }
    }
    
    setUploading(false);
  };

  const uploadVideo = async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
    formData.append('category', 'real-estate');
    formData.append('propertyType', 'house');

    try {
      await apiClient.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // File uploaded successfully
      fetchVideos();
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const updateVideoCaption = async (videoId: number, caption: string): Promise<void> => {
    try {
      await apiClient.put(`/videos/${videoId}`, {
        description: caption
      });
      
      // Update the video in the local state
      setVideos(prev => prev.map(video => 
        video.id === videoId ? { ...video, description: caption } : video
      ));
      
    } catch (error) {
      console.error('Update caption error:', error);
    }
  };

  const handleCaptionChange = (videoId: number, value: string): void => {
    setEditingCaptions(prev => ({
      ...prev,
      [videoId]: value
    }));
  };

  const deleteVideo = async (videoId: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    
    try {
      await apiClient.delete(`/videos/${videoId}`);
      fetchVideos();
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };

  const getPostingFrequency = (lastPosted?: string): string => {
    if (!lastPosted) return 'Never posted';
    const daysSince = Math.floor((Date.now() - new Date(lastPosted).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince === 0) return 'Posted today';
    if (daysSince === 1) return 'Posted yesterday';
    return `Posted ${daysSince} days ago`;
  };

  const getVideoStatus = (video: Video): string => {
    if (video.postCount === 0) return 'New';
    if (video.lastPosted) {
      const daysSince = Math.floor((Date.now() - new Date(video.lastPosted).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince < 7) return 'Recently posted';
      if (daysSince < 30) return 'Ready to post';
      return 'Ready to repost';
    }
    return 'Ready';
  };

  const generateCaption = async (videoId: number): Promise<void> => {
    try {
      setGeneratingCaptions(prev => ({ ...prev, [videoId]: true }));
      
      const response = await apiClient.post('/ai/generate-caption', {
        videoId,
        type: 'real-estate',
        style: 'engaging'
      });
      
      const generatedCaption = response.data.caption;
      setEditingCaptions(prev => ({
        ...prev,
        [videoId]: generatedCaption
      }));
      
      // Auto-save the generated caption
      await updateVideoCaption(videoId, generatedCaption);
    } catch (error) {
      console.error('Generate caption error:', error);
    } finally {
      setGeneratingCaptions(prev => ({ ...prev, [videoId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload New Video</h3>
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-sm text-gray-600">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                <span onClick={() => fileInputRef.current?.click()}>Upload a file</span>
                <input 
                  ref={fileInputRef}
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  className="sr-only" 
                  accept="video/*" 
                  multiple
                  onChange={handleFileSelect}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">MP4, MOV up to 100MB</p>
            {uploading && (
              <div className="text-sm text-blue-600">
                Uploading videos...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Videos ({videos.length})</h3>
        </div>
        
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No videos uploaded yet
            </h3>
            <p className="text-gray-500">
              Upload your first real estate video to get started with auto-posting
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {videos.map((video) => (
              <div key={video.id} className="bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                {/* Video Preview */}
                <div className="relative h-48 bg-gray-200 flex items-center justify-center">
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      getVideoStatus(video) === 'New' ? 'bg-green-100 text-green-800' :
                      getVideoStatus(video) === 'Recently posted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {getVideoStatus(video)}
                    </span>
                  </div>
                  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 truncate">
                    {video.title}
                  </h3>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <div>Posted: {video.postCount || 0} times</div>
                    <div>{getPostingFrequency(video.lastPosted)}</div>
                    <div>Size: {video.fileSize ? `${Math.round(video.fileSize / 1024 / 1024)}MB` : 'Unknown'}</div>
                  </div>

                  {/* Caption */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Caption:
                      </label>
                      <button
                        onClick={() => generateCaption(video.id)}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        disabled={generatingCaptions[video.id]}
                      >
                        {generatingCaptions[video.id] ? 'Generating...' : '✨ Generate'}
                      </button>
                    </div>
                    <textarea
                      value={editingCaptions[video.id] || video.description || ''}
                      onChange={(e) => handleCaptionChange(video.id, e.target.value)}
                      onBlur={() => updateVideoCaption(video.id, editingCaptions[video.id] || '')}
                      className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                      rows={3}
                      placeholder="Add a caption for this video..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => deleteVideo(video.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {video.status || 'Ready'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function VideosPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <Layout title="Video Library">
      <VideosContent />
    </Layout>
  )
} 