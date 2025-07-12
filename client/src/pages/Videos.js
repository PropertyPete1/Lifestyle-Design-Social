import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import AuthenticatedVideo from '../components/AuthenticatedVideo';

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editingCaptions, setEditingCaptions] = useState({}); // Changed to object for multiple videos
  const [loading, setLoading] = useState(true);
  const [generatingCaptions, setGeneratingCaptions] = useState({});
  const fileInputRef = useRef(null);
  const { token } = useAuth();

  // Initialize editing captions when videos load
  useEffect(() => {
    if (videos.length > 0) {
      const captions = {};
      videos.forEach(video => {
        captions[video.id] = video.description || '';
      });
      setEditingCaptions(captions);
    }
  }, [videos]);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
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

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files) => {
    setUploading(true);
    
    for (let file of files) {
      if (file.type.startsWith('video/')) {
        await uploadVideo(file);
      }
    }
    
    setUploading(false);
  };

  const uploadVideo = async (file) => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
    formData.append('category', 'real-estate');
    formData.append('propertyType', 'house');

    try {
      const response = await axios.post('/api/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // You could add a progress indicator here
        }
      });

      toast.success(`Uploaded: ${file.name}`);
      fetchVideos();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const updateVideoCaption = async (videoId, caption) => {
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

  const handleCaptionChange = (videoId, value) => {
    setEditingCaptions(prev => ({
      ...prev,
      [videoId]: value
    }));
  };

  const deleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    
    try {
      await axios.delete(`/api/videos/${videoId}`);
      toast.success('Video deleted');
      fetchVideos();
    } catch (error) {
      toast.error('Failed to delete video');
    }
  };

  const getPostingFrequency = (lastPosted) => {
    if (!lastPosted) return 'Never posted';
    const daysSince = Math.floor((Date.now() - new Date(lastPosted)) / (1000 * 60 * 60 * 24));
    if (daysSince === 0) return 'Posted today';
    if (daysSince === 1) return 'Posted yesterday';
    return `Posted ${daysSince} days ago`;
  };

  const getVideoStatus = (video) => {
    if (video.postCount === 0) return 'New';
    if (video.lastPosted) {
      const daysSince = Math.floor((Date.now() - new Date(video.lastPosted)) / (1000 * 60 * 60 * 24));
      if (daysSince < 7) return 'Recently posted';
      if (daysSince < 30) return 'Ready to post';
      return 'Ready to repost';
    }
    return 'Ready';
  };

  const generateCaption = async (videoId) => {
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
                  videoId={video.id}
                  className="w-full h-full object-cover"
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
                    rows="3"
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