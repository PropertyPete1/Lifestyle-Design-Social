import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

interface Post {
  id: string;
  title?: string;
  platform?: string;
  caption?: string;
  status: 'published' | 'scheduled' | 'failed' | 'processing';
  scheduledAt: string;
  thumbnail?: string;
  views?: number;
  likes?: number;
  comments?: number;
  url?: string;
}

type PostAction = 'edit' | 'delete' | 'publish' | 'cancel' | 'retry';
type BulkAction = 'publish' | 'cancel';
type PostStatus = 'all' | 'scheduled' | 'published' | 'failed' | 'processing';

const Posts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<PostStatus>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState<boolean>(false);

  const fetchPosts = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/posts?status=${filter}`);
      // Ensure posts is always an array
      const postsData = Array.isArray(response.data) ? response.data : 
                      (response.data.posts && Array.isArray(response.data.posts)) ? response.data.posts : [];
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Set empty array on error to prevent filter issues
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostAction = async (postId: string, action: PostAction): Promise<void> => {
    try {
      await axios.post(`/api/posts/${postId}/${action}`);
      fetchPosts(); // Refresh the list
    } catch (error) {
      console.error(`Error ${action}ing post:`, error);
    }
  };

  const handleBulkAction = async (action: BulkAction): Promise<void> => {
    try {
      await axios.post('/api/posts/bulk-action', {
        postIds: selectedPosts,
        action: action
      });
      setSelectedPosts([]);
      setShowBulkActions(false);
      fetchPosts();
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  const togglePostSelection = (postId: string): void => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const getStatusIcon = (status: Post['status']): JSX.Element => {
    switch (status) {
      case 'published':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'scheduled':
        return <ClockIcon className="h-5 w-5 text-yellow-400" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case 'processing':
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Post['status']): string => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.platform?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.caption?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Posts Management</h1>
          <p className="text-yellow-200">Manage your scheduled and published content</p>
        </div>
        <div className="flex space-x-4 mt-4 sm:mt-0">
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className="btn-secondary"
            disabled={selectedPosts.length === 0}
          >
            Bulk Actions ({selectedPosts.length})
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as PostStatus)}
          className="input-field"
        >
          <option value="all">All Posts</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="failed">Failed</option>
          <option value="processing">Processing</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && selectedPosts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">
              {selectedPosts.length} posts selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('publish')}
                className="btn-success text-sm"
              >
                Publish Now
              </button>
              <button
                onClick={() => handleBulkAction('cancel')}
                className="btn-error text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setSelectedPosts([])}
                className="btn-secondary text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <div key={post.id} className="card-hover">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedPosts.includes(post.id)}
                  onChange={() => togglePostSelection(post.id)}
                  className="rounded border-yellow-400 text-yellow-400 focus:ring-yellow-400"
                />
                {getStatusIcon(post.status)}
                <span className={`status-badge ${getStatusColor(post.status)}`}>
                  {post.status}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePostAction(post.id, 'edit')}
                  className="p-1 text-yellow-400 hover:text-yellow-300"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePostAction(post.id, 'delete')}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Video Thumbnail */}
            {post.thumbnail && (
              <div className="relative mb-4">
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                  <PlayIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            )}

            {/* Post Content */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold text-lg">{post.title}</h3>
              <p className="text-yellow-200 text-sm line-clamp-3">{post.caption}</p>
              
              {/* Platform and Schedule */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-400 font-medium">{post.platform}</span>
                <div className="flex items-center space-x-1 text-yellow-200">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{new Date(post.scheduledAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Engagement Stats */}
              {post.status === 'published' && (
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-yellow-400 border-opacity-20">
                  <div className="text-center">
                    <p className="text-white font-semibold">{post.views?.toLocaleString() || '0'}</p>
                    <p className="text-yellow-200 text-xs">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">{post.likes?.toLocaleString() || '0'}</p>
                    <p className="text-yellow-200 text-xs">Likes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">{post.comments?.toLocaleString() || '0'}</p>
                    <p className="text-yellow-200 text-xs">Comments</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-3">
                {post.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => handlePostAction(post.id, 'publish')}
                      className="btn-success flex-1 text-sm"
                    >
                      Publish Now
                    </button>
                    <button
                      onClick={() => handlePostAction(post.id, 'cancel')}
                      className="btn-error text-sm px-3"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {post.status === 'processing' && (
                  <button
                    onClick={() => handlePostAction(post.id, 'retry')}
                    className="btn-warning flex-1 text-sm"
                  >
                    Retry
                  </button>
                )}
                {post.status === 'published' && (
                  <button
                    onClick={() => window.open(post.url, '_blank')}
                    className="btn-secondary flex-1 text-sm"
                  >
                    <EyeIcon className="h-4 w-4 inline mr-1" />
                    View
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-yellow-200 mb-4">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No posts found</h3>
            <p className="text-yellow-200">
              {searchTerm ? 'Try adjusting your search terms' : 'Start by scheduling your first post'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Posts; 