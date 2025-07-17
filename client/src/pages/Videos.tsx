import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AuthenticatedVideo from '../components/AuthenticatedVideo';

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
  thumbnailPath?: string;
  starred?: boolean;
  resolution?: string;
}

interface EditingCaptions {
  [videoId: number]: string;
}

interface GeneratingCaptions {
  [videoId: number]: boolean;
}

const Videos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [editingCaptions, setEditingCaptions] = useState<EditingCaptions>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingCaptions, setGeneratingCaptions] = useState<GeneratingCaptions>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize editing captions when videos load
  useEffect(() => {
    if (videos.length > 0) {
      const captions: EditingCaptions = {};
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
      const response = await axios.get('/api/videos');
      setVideos(response.data.videos || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
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
    
    for (let file of Array.from(files)) {
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
      await axios.post('/api/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            // Progress tracking could be added here in the future
            Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        }
      });

      toast.success(`Uploaded: ${file.name}`);
      fetchVideos();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const updateVideoCaption = async (videoId: number, caption: string): Promise<void> => {
    try {
      await axios.put(`/api/videos/${videoId}`, {
        description: caption
      });
      
      // Update the video in the local state
      setVideos(prev => prev.map(video => 
        video.id === videoId ? { ...video, description: caption } : video
      ));
      
      toast.success('Caption updated!');
    } catch (error) {
      console.error('Update caption error:', error);
      toast.error('Failed to update caption');
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
      await axios.delete(`/api/videos/${videoId}`);
      toast.success('Video deleted');
      fetchVideos();
    } catch (error) {
      toast.error('Failed to delete video');
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
      
      const response = await axios.post('/api/ai/generate-caption', {
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
      toast.success('Caption generated!');
    } catch (error) {
      console.error('Generate caption error:', error);
      toast.error('Failed to generate caption');
    } finally {
      setGeneratingCaptions(prev => ({ ...prev, [videoId]: false }));
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          🏠 Real Estate Video Library
        </h1>
        
        {/* Upload Section */}
        <div className="mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="text-6xl">📹</div>
              <h3 className="text-xl font-semibold text-gray-700">
                Upload Your Real Estate Videos
              </h3>
              <p className="text-gray-500">
                Drag and drop your house tour videos here, or click to browse
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Select Videos'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              {/* Video Preview */}
              <div className="relative h-48 bg-gray-200">
                <AuthenticatedVideo
                  videoId={String(video.id)}
                  className="w-full h-full object-cover"
                  poster={video.thumbnailPath ? `/api/videos/${video.id}/thumbnail` : undefined}
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    getVideoStatus(video) === 'New' ? 'bg-green-100 text-green-800' :
                    getVideoStatus(video) === 'Recently posted' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {getVideoStatus(video)}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  {video.category === 'real-estate' ? '🏠' : '🎬'} {video.category}
                </div>
                {video.starred && (
                  <div className="absolute top-2 left-2 text-yellow-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                )}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2 truncate">
                  {video.title}
                </h3>
                
                <div className="text-sm text-gray-600 mb-3">
                  <div>Posted: {video.postCount || 0} times</div>
                  <div>{getPostingFrequency(video.lastPosted)}</div>
                  <div>Duration: {video.duration ? `${Math.round(video.duration)}s` : 'Unknown'}</div>
                  {video.resolution && (
                    <div>Resolution: {video.resolution}</div>
                  )}
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
                  <div className="text-xs text-gray-500">
                    {video.fileSize ? `${Math.round(video.fileSize / 1024 / 1024)}MB` : ''}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {videos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No videos uploaded yet
            </h3>
            <p className="text-gray-500">
              Upload your first real estate video to get started with auto-posting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Videos; 