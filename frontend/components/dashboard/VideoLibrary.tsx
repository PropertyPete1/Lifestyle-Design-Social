'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VideoCameraIcon, PlusIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import { Video, VideoCategory, VideoUploadForm } from '@/lib/types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function VideoLibrary() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();

  // Fetch videos
  const { data: videos, isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: () => apiClient.videos.getAll(),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiClient.videos.upload(formData, setUploadProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setIsUploadModalOpen(false);
      setUploadProgress(0);
      toast.success('Video uploaded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Upload failed');
      setUploadProgress(0);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.videos.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Video deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Delete failed');
    },
  });

  const handleUpload = (uploadData: VideoUploadForm) => {
    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description || '');
    formData.append('category', uploadData.category);
    formData.append('tags', JSON.stringify(uploadData.tags));

    uploadMutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Video Library</h2>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Upload Video</span>
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : videos?.data && videos.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.data.map((video: Video) => (
            <div key={video.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <VideoCameraIcon className="h-12 w-12 text-gray-400" />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate">{video.title}</h3>
                {video.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.description}</p>
                )}
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <div>Duration: {formatDuration(video.duration)}</div>
                  <div>Size: {formatFileSize(video.fileSize)}</div>
                  <div>Category: {video.category}</div>
                  <div>Posts: {video.postCount}</div>
                </div>
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => {/* TODO: Add view functionality */}}
                    className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No videos yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload your first real estate video to get started.
            </p>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Upload Your First Video
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <VideoUploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleUpload}
          isUploading={uploadMutation.isPending}
          uploadProgress={uploadProgress}
        />
      )}
    </div>
  );
}

interface VideoUploadModalProps {
  onClose: () => void;
  onUpload: (data: VideoUploadForm) => void;
  isUploading: boolean;
  uploadProgress: number;
}

function VideoUploadModal({ onClose, onUpload, isUploading, uploadProgress }: VideoUploadModalProps) {
  const [formData, setFormData] = useState<Partial<VideoUploadForm>>({
    title: '',
    description: '',
    category: 'real-estate',
    tags: [],
  });
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !formData.title) {
      toast.error('Please provide a title and select a video file');
      return;
    }

    onUpload({
      ...formData,
      file,
    } as VideoUploadForm);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('video/')) {
        setFile(droppedFile);
      } else {
        toast.error('Please select a video file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Video</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="cursor-pointer">
                <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {file ? file.name : 'Drop your video here or click to browse'}
                </p>
                <p className="text-xs text-gray-500">MP4, MOV, AVI up to 100MB</p>
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter video title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Describe your video (optional)"
            />
            <p className="text-xs text-gray-500 mt-1">
              If this video was posted before on Instagram, the description will be automatically fetched and saved.
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category || 'real-estate'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as VideoCategory })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="real-estate">Real Estate</option>
              <option value="cartoon">Cartoon</option>
              <option value="educational">Educational</option>
              <option value="promotional">Promotional</option>
              <option value="testimonial">Testimonial</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
              })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="luxury, downtown, investment, etc."
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file || !formData.title}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 